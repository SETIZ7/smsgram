import { ObjectId } from "mongodb";

export type Message = {
  _id?: ObjectId;
  chatId: ObjectId;
  from: string; // user._id
  text: string;
  createdAt: Date;
};
 
