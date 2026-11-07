# ConnectTime Dating setup

The dating experience is available at `/dating`. It reuses the existing verified-member profile discovery and block controls.

## Required Appwrite configuration

Set `APPWRITE_DATING_LIKES_TABLE_ID` to a new table in the existing ConnectTime Appwrite database. Do not create another database.

Create these columns in the existing profiles table (`APPWRITE_PROFILES_TABLE_ID`):

| Column | Type | Required |
|---|---|---|
| `age` | Integer | No (profiles without a dating age are not shown in dating) |
| `gender` | String | No (profiles without a dating gender are not shown in dating) |
| `interested_in` | String | No |
| `relationship_goal` | String | No |

Create the likes table and columns:

| Column | Type |
|---|---|
| `sender_user_id` | String |
| `recipient_user_id` | String |
| `created_at` | DateTime |

Add indexes for `sender_user_id` and `recipient_user_id`. Add a unique composite index on sender + recipient if supported by the Appwrite table/index configuration. The API also checks for duplicate likes before inserting.

## Behavior and safeguards

- Dating discovery and likes require a signed-in, independently verified adult account.
- Only public/member-visible profiles with an age of 18+ and a dating gender appear in dating results.
- The like endpoint independently checks the recipient's adult eligibility and honors either-direction blocks.
- A match is reported only when both members have liked one another.
- Filters include age range, gender, relationship goal, country and shared interests.
- Add the four profile columns before enabling dating in production. The regular profile editor keeps these fields optional for members who do not use dating.
- Do not display birth dates, identity documents or precise location.
