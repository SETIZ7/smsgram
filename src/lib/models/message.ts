import { ObjectId } from "mongodb";

export type Message = {
  _id: ObjectId;
  conversationId: ObjectId;
  from: string; // userId
  text: string;
  createdAt: Date;
};
 
