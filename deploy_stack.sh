#!/usr/bin/env bash

# deploy_stack.sh
# Adapted from londonkpc-backend's script of the same name -- same
# mechanism, retargeted to Portfolio's stack
# naming and its GlobalCertificateArn parameter (resolved at deploy time
# via ACM, not modeled as a CFN resource -- certs aren't transferable
# between accounts and this avoids a cross-account DNS-validation custom
# resource for what's normally a one-time manual step anyway).

set -e

PATH_TO_TEMPLATE=""
ENVIRONMENT="prod"
ORGANIZATION="cheekane"
DOMAIN_NAME="cheekane.com"

while getopts "f:e:" opt; do
  case $opt in
  f)
    PATH_TO_TEMPLATE=$OPTARG ;;
  e)
    ENVIRONMENT=$OPTARG ;;
  \?)
    echo "Usage: $0 -f <path_to_template> -e <environment>"
    echo "-f Path to CloudFormation template file. Ex: 'portfolio.yaml'."
    echo "-e (Optional) Deployment environment. Default is 'prod'. Options: 'dev', 'prod'"
    exit 1
    ;;
  esac
done

echo "Validating arguments."

if [[ ! "$ENVIRONMENT" =~ ^(dev|prod)$ ]]; then
  echo "Error: Invalid environment '$ENVIRONMENT'. Must be dev or prod."
  exit 1
fi

declare -a commands=(aws yq)
for cmd in "${commands[@]}"; do
  if ! command -v "$cmd" &> /dev/null; then
    echo "Error: $cmd not installed."
    exit 1
  fi
done

if [[ ! -f "$PATH_TO_TEMPLATE" ]] || [[ ! "$PATH_TO_TEMPLATE" == *.yaml && ! "$PATH_TO_TEMPLATE" == *.yml ]]; then
  echo "Error: Invalid path to template or the file is not a YAML file: ${PATH_TO_TEMPLATE}"
  exit 1
fi

AWS_PROFILE="$ORGANIZATION"

TEMPLATE_STEM=$(basename "$PATH_TO_TEMPLATE" .yaml)
STACK_NAME="$ORGANIZATION-portfolio-${TEMPLATE_STEM//_/-}-$ENVIRONMENT"

echo "Template stem: '$TEMPLATE_STEM'."
echo "Stack name: '$STACK_NAME'."

echo "Building parameter overrides."

PARAMETER_KEYS=$(yq -r '.Parameters | keys | .[]' "$PATH_TO_TEMPLATE")

PARAMETER_OVERRIDES="Environment=$ENVIRONMENT Organization=$ORGANIZATION"

for key in $PARAMETER_KEYS; do
  case $key in
  GlobalCertificateArn)
    echo "Fetching Global Certificate ARN for $DOMAIN_NAME..."
    GLOBAL_CERT_ARN=$(aws acm list-certificates \
      --profile "$AWS_PROFILE" \
      --region us-east-1 \
      --query "CertificateSummaryList[?DomainName=='$DOMAIN_NAME'].CertificateArn | [0]" \
      --output text)

    if [ "$GLOBAL_CERT_ARN" == "None" ] || [ -z "$GLOBAL_CERT_ARN" ]; then
      echo "Error: Could not find Global ACM Certificate in us-east-1 for $DOMAIN_NAME"
      exit 1
    fi
    echo "Found Global ARN: $GLOBAL_CERT_ARN"
    PARAMETER_OVERRIDES+=" $key=$GLOBAL_CERT_ARN"
    ;;
  esac
done

echo "Parameter overrides: '$PARAMETER_OVERRIDES'."

deploy_command="aws cloudformation deploy \
  --template-file $PATH_TO_TEMPLATE \
  --stack-name $STACK_NAME \
  --parameter-overrides $PARAMETER_OVERRIDES \
  --capabilities CAPABILITY_NAMED_IAM \
  --profile $AWS_PROFILE"

AWS_USERNAME=$(aws sts get-caller-identity \
  --profile "$AWS_PROFILE" \
  --query "Arn" \
  --output text | awk -F '/' '{print $NF}'
)

if ! eval "$deploy_command"; then
  echo "The deployment of $STACK_NAME by $AWS_USERNAME failed."

  STACK_STATUS=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --profile "$AWS_PROFILE" \
    --query "Stacks[0].StackStatus" \
    --output text 2>/dev/null
  )

  STACK_RESOURCE_STATUS_REASON=$(aws cloudformation describe-stack-events \
    --stack-name "$STACK_NAME" \
    --profile "$AWS_PROFILE" \
    --query "StackEvents[?ResourceStatus=='CREATE_FAILED' || ResourceStatus=='UPDATE_FAILED' || ResourceStatus=='UPDATE_ROLLBACK_FAILED'] | [0].ResourceStatusReason" \
    --output text 2>/dev/null | tr -d '\"()[]{}<>'
  )

  echo "Stack status: $STACK_STATUS"
  echo "Stack status reason: $STACK_RESOURCE_STATUS_REASON"
  exit 1
else
  echo "The deployment of $STACK_NAME by $AWS_USERNAME was successful."

  STACK_STATUS=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --profile "$AWS_PROFILE" \
    --query "Stacks[0].StackStatus" \
    --output text 2>/dev/null
  )

  echo "Stack status: $STACK_STATUS"
fi
