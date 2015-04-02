module.exports = {
  region: 'us-east-1',
  handler: 'index.handler',
  role: 'arn:aws:iam::106586740595:role/executionrole',
  functionName: 'file-to-png-zip',
  timeout: 60
}
