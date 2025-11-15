export interface GalleryItem extends Story {
  id: string;
  uri: string;
  width: number;
  height: number;
  creationTime: number;
}

export interface Story {
  id: string;
  title?: string;
  like_count?: number;
  username?: string;
  profile_image?: string;

  image?: string;
}

export interface StoryRowProps {
  stories: Story[];
  contestStoryData: Story[];
}
