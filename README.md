# gmail_archive

Simple Serverless Framework application to archive GMail messages to an S3
bucket.

This creates a Lambda and schedules it to run every 2 hours. The lambda will:

* Retreive unprocessed messages from GMail using POP3
* Upload messages to an S3 bucket. The filename will be:

        yyyy/mm/dd/{md5-hash-of-contents}

## Prerequisites

* Serverless Framework (used 2.48.0)
* AWS CLI and profile
* S3 bucket for storing messages

## Deploying

* Configure `AWS_PROFILE` and `AWS_REGION` (possibly using `direnv` and
  `.envrc`)
* Create `.env` and set the following variables:
* * `username` - GMail username
* * `password` - GMail password (use application-specific password if 2FA is
    enabled)
* * `bucket` - S3 bucket name
* * `alert_email` - Email address for CloudWatch alarms for lambda errors
* Deploy with `serverless deploy`
