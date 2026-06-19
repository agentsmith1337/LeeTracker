export type RevisionCategory = "CODING" | "RIDDLE" | "QUANT";

export type Platform =
  | "leetcode"
  | "gfg"
  | "codeforces"
  | "hackerrank"
  | "codechef"
  | "cses"
  | "other";

export interface Revision {
  id: string;
  category: RevisionCategory;
  title: string;
  url: string | null;
  platform: string | null;
  revisionDate: string;
  createdAt: string;
}

export interface LectureVideo {
  id: string;
  position: number;
  title: string;
  videoId: string | null;
  url: string | null;
  thumbnailPath: string | null;
  watched: boolean;
}

export interface LecturePlaylist {
  id: string;
  url: string;
  title: string | null;
  sortOrder: number;
  createdAt: string;
  videos: LectureVideo[];
}