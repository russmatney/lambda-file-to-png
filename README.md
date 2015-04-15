# lambda-file-to-png

Convert a jpg or gif to pngs

# Usage

Invoke this function like any lambda function, as documented in the aws sdk.

- [JavaScript](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html#invoke-property)
- [Ruby](http://docs.aws.amazon.com/sdkforruby/api/Aws/Lambda/Client.html#invoke-instance_method)
- [PHP](http://docs.aws.amazon.com/aws-sdk-php/latest/class-Aws.Lambda.LambdaClient.html#_invokeAsync)
- [Python](http://boto.readthedocs.org/en/latest/)
- OR on the function's "edit" tab via amazon's interface
- OR via the AWS CLI

# Payload

## required

- `srcUrl` - URL to the .jpg or .gif file
- `destBucket` - S3 bucket for the created pngs
- `pngsDir` - S3 prefix/folder for the created pngs

## optional

- `watermarkUrl` - URL for a .png watermark to download and apply to each .png

