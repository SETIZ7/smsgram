import { ObjectId } from "mongodb";

export type Chat = {
  _id?: ObjectId;
  type: "private" | "group";
  members: string[]; // user._id
  title?: string; // فقط برای group
  createdAt: Date;
};
