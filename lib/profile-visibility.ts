/** Returns whether an authenticated, eligible viewer may see a profile. */
export function canViewProfile(visibility: string, viewerIsOwner: boolean, viewerIsFriend: boolean): boolean {
  switch (visibility) {
    case "public":
    case "members":
      return true;
    case "friends":
      return viewerIsOwner || viewerIsFriend;
    case "private":
      return viewerIsOwner;
    default:
      return false;
  }
}
