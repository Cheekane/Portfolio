#!/usr/bin/env bash

# deploy_content.sh
# Syncs this directory's static site content to the hosting bucket root
# and invalidates the CloudFront cache.

set -e
set -o pipefail

ENVIRONMENT="prod"
ORGANIZATION="cheekane"

while getopts "e:" opt; do
  case $opt in
  e)
    ENVIRONMENT=$OPTARG ;;
  \?)
    echo "Usage: $0 [-e <environment>]"
    echo "-e (Optional) Deployment environment. Default is 'prod'. Options: 'dev', 'prod'"
    exit 1
    ;;
  esac
done

if [[ ! "$ENVIRONMENT" =~ ^(dev|prod)$ ]]; then
  echo "Error: Invalid environment '$ENVIRONMENT'"
  exit 1
fi

for cmd in aws jq; do
  if ! command -v $cmd &>/dev/null; then
    echo "Error: $cmd is not installed." >&2
    exit 1
  fi
done

AWS_PROFILE="$ORGANIZATION"
STACK_NAME="$ORGANIZATION-portfolio-portfolio-$ENVIRONMENT"

BUCKET=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --profile "$AWS_PROFILE" | jq -r '.Stacks[0].Outputs[] | select(.OutputKey=="HostingBucketName") | .OutputValue')

DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --profile "$AWS_PROFILE" | jq -r '.Stacks[0].Outputs[] | select(.OutputKey=="CloudFrontDistributionId") | .OutputValue')

if [ -z "$BUCKET" ] || [ -z "$DISTRIBUTION_ID" ]; then
  echo "Error: Could not resolve bucket/distribution from stack $STACK_NAME outputs."
  exit 1
fi

echo "Syncing site content to s3://$BUCKET/ (root) ..."
aws s3 sync . s3://"$BUCKET"/ \
  --delete \
  --exclude ".git/*" \
  --exclude ".idea/*" \
  --exclude ".gitignore" \
  --exclude ".DS_Store" \
  --exclude "deploy_stack.sh" \
  --exclude "deploy_content.sh" \
  --exclude "portfolio.yaml" \
  --exclude "README.md" \
  --profile "$AWS_PROFILE"

echo "Clearing CloudFront cache for $DISTRIBUTION_ID..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*" \
  --query "Invalidation.Id" \
  --output text \
  --profile "$AWS_PROFILE"
)

echo "Invalidation created (ID: '$INVALIDATION_ID'). Waiting for completion..."
aws cloudfront wait invalidation-completed \
  --distribution-id "$DISTRIBUTION_ID" \
  --id "$INVALIDATION_ID" \
  --profile "$AWS_PROFILE"

echo "Done."
