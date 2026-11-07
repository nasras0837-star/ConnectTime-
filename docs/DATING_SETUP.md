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

Add indexes for `sender_user_id`, `recipient_user_id`, and `created_at` (the inbox sorts received likes by creation time). Add a unique composite index on sender + recipient if supported by the Appwrite table/index configuration. The API also checks for duplicate likes before inserting.

## Behavior and safeguards

- Dating discovery and likes require a signed-in, independently verified adult account.
- Only public/member-visible profiles with an age of 18+ and a dating gender appear in dating results.
- The like endpoint independently checks the recipient's adult eligibility and honors either-direction blocks.
- A match is reported only when both members have liked one another.
- Filters include age range, gender, relationship goal, country and shared interests.
- Add the four profile columns before enabling dating in production. The regular profile editor keeps these fields optional for members who do not use dating.
- Do not display birth dates, identity documents or precise location.


## Likes inbox and matches

- Members can open `/dating/likes` to review likes received, mutual matches, and likes they have sent.
- A received like can be answered with **Like back** or dismissed. Dismissal deletes only the selected incoming like row and is restricted to its recipient.
- A mutual match is created when both users have liked one another. Members can send a separate friend request from a match; private messaging remains limited to accepted friends.
- Inbox results hide profiles that are not public/member-visible, do not have a dating profile for adults, fail independent adult eligibility, or are blocked in either direction.
- Keep the likes table accessible only to the server-side API. The API uses the server Appwrite key and verifies the signed-in member before reading or changing likes.
