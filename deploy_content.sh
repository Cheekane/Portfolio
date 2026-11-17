#!/usr/bin/env bash

# deploy_content.sh
# Builds the site, syncs the build output folder (dist/) to the hosting
# bucket root and invalidates the CloudFront cache.

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

for cmd in aws jq npm; do
  if ! command -v $cmd &>/dev/null; then
    echo "Error: $cmd is not installed." >&2
    exit 1
  fi
done

# Always run from the repository root, wherever the script is called from.
cd "$(dirname "$0")"

BUILD_DIR="dist"
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

echo "Building the site into $BUILD_DIR/ ..."
npm ci
npm run build

if [ ! -f "$BUILD_DIR/index.html" ]; then
  echo "Error: $BUILD_DIR/index.html is missing. The build did not produce a site."
  exit 1
fi

echo "Syncing $BUILD_DIR/ to s3://$BUCKET/ (root) ..."

# Files under _astro/ have a content hash in their name, so browsers can
# keep them for a year.
aws s3 sync "$BUILD_DIR/_astro" s3://"$BUCKET"/_astro \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --profile "$AWS_PROFILE"

# Everything else (HTML, sitemap, favicon) is checked again on each visit.
aws s3 sync "$BUILD_DIR" s3://"$BUCKET"/ \
  --delete \
  --exclude "_astro/*" \
  --exclude ".DS_Store" \
  --cache-control "public, max-age=0, must-revalidate" \
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
