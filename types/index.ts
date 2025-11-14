export interface RoomInfo {
  id: string;
  name?: string | null;
  userCount: number;
  owner: string;
  ownerDeviceId: string;
  ownerPhoneNumber?: string; // Added for contact-based filtering
  invitedPhoneNumbers?: string[]; // List of invited phone numbers
  hasImage: boolean;
  currentImage?: string | null;
  currentImageBlurHash?: string | null;
  emojiCount: number;
  proposalsCount?: number;
  participants?: Array<{
    deviceId: string;
    userName: string;
    isOnline: boolean;
    profileImage?: string;
  }>;
}
