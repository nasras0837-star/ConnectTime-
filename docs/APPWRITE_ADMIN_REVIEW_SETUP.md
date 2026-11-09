# Connect admin review dashboard

The staff dashboard is available at `/admin/review`. It is protected by a server-side Appwrite user-ID allowlist. A hidden link or client-side role is not an access control.

## Required environment variables

Set these on the server deployment only:

- `CONNECT_ADMIN_USER_IDS`: comma-separated Appwrite user IDs for trusted staff. Do not use display names or email addresses.
- `APPWRITE_COMMUNITY_REPORTS_TABLE_ID`: ID of the private community reports table.
- `APPWRITE_ACCOUNT_CLOSURE_REQUESTS_TABLE_ID`: ID of the private account-closure requests table.
- Existing Appwrite configuration: `NEXT_PUBLIC_APPWRITE_ENDPOINT`, `NEXT_PUBLIC_APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY`, and `APPWRITE_DATABASE_ID`.

Keep the API key and allowlist out of browser-exposed variables. Do not use a `NEXT_PUBLIC_` prefix for either secret.

## Permissions and data

Keep both tables private to the server-side Appwrite API key. Do not grant member clients read or update access. The review API returns a bounded list of up to 100 reports and 100 closure requests and only returns the fields needed by the staff screen.

The dashboard permits these status values:

- Reports: `open`, `reviewing`, `actioned`, `dismissed`.
- Account closure: `pending_review`, `approved`, `rejected`, `processed`.

Status updates do not delete content, suspend members, deactivate accounts, erase personal data, or cancel subscriptions. Those actions require a separate approved workflow and appropriate retention/legal checks.

## Operational limitations

This initial dashboard is a staff queue, not a full case-management or audit system. It does not yet provide immutable audit history, assignment, evidence attachments, appeals review, or bulk actions. Restrict the allowlist to a small number of trusted staff, require strong account security/MFA, and review access periodically.
