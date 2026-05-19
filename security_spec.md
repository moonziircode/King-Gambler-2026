# Security Spec

## Data Invariants
1. Users can only modify their own profile data (points/stats should only be updateable by the backend system/admin, or client logic must be constrained to incremental updates based on match triggers - wait, if the backend script is external, maybe users can't edit points). To be safe, users can only update `displayName` and `photoURL`. `totalPoints`, `exacts`, and `closes` are only added upon create and updated by the backend.
2. A user can only create a prediction if the current timestamp is before the match's kickoff time (`status` == 'scheduled').
3. Users can only read predictions of other users if the Match `status` != 'scheduled'.
4. A user can only join a league (create LeagueMember) if they have the league code (wait, join links usually mean the frontend provides the code). In Firestore, members create their own LeagueMember document.
5. Only League members can post in the chat.
6. Only the Host can edit the League's name.

## The "Dirty Dozen" Payloads
1. **Identity Spoofing**: User A creates a prediction for User B (predictionId=B, userId=B) -> `FAIL`.
2. **State Shortcutting**: User attempts to update match status to `finished` -> `FAIL` (Users cannot edit Matches).
3. **Ghost Fields Update**: User attempts to update their prediction adding `isAdmin=true` -> `FAIL` (strict key checks).
4. **Late Prediction**: User attempts to create/update a prediction where match `status` != 'scheduled' -> `FAIL`.
5. **Score spoofing**: User attempts to update their own `totalPoints` -> `FAIL` (only server/backend script can update).
6. **Chat without joining**: Non-member adds a chat message to a league -> `FAIL` (must exist in `/members/$(request.auth.uid)`).
7. **Resource Poisoning**: User sets League `name` to a 20KB string -> `FAIL` (size check).
8. **Blind Data scraping**: User lists predictions for match while `status` == 'scheduled' -> `FAIL` (rule explicitly checks `status != 'scheduled' || request.auth.uid == userId`).
9. **Role Escalation**: League member changes their role from `player` to `host` -> `FAIL`.
10. **Admin spoofing**: Someone tries to mark themselves as Admin -> `FAIL`.
11. **Orphan creation**: Create a prediction for a match that doesn't exist -> `FAIL` (`exists()` check on parent match).
12. **Kick protection**: Host tries to delete a member -> `FAIL` (Admin powers are limited, host can't delete members).

## Testing
We will create a `firestore.rules.test.ts`.
