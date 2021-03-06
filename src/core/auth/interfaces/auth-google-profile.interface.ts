export interface AuthGoogleProfile {
  id: string;
  emails: {
    value: string;
  }[];
  name: {
    givenName: string;
    familyName: string;
  };
}
