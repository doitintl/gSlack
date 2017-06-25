# gcp-alert-service

## Datastore configuration

- Config {"name":"slackAPIToken","value":"...."} (exactly 1)
- Test {"slackChannel":"...","test":"...","message":"..."} (1 or more)

`test` Must be a a valid JS expression that returns a boolean. If it returns true the test passes. e.g. `$.protoPayload.serviceName==='cloudfunctions.googleapis.com'`

`message` Must be a a valid JS string template. It will be evaluated to produce the message. e.g. `This is the logname: ${$.logName}`
