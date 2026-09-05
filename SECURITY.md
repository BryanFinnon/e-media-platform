# Security policy

Please report suspected vulnerabilities privately through GitHub Security Advisories rather than opening a public issue.

## Security design

- Secrets and privileged provider clients remain server-side.
- External input is validated at server boundaries.
- Protected routes enforce authentication and authorisation on the server.
- Public form submissions use database-backed rate limits.
- Uploads are validated by type and size before storage.
- Administrative mutations are recorded in an audit log.

Never commit `.env`, `.env.local`, service credentials, access tokens or production data. Use isolated development data when running the test suite.
