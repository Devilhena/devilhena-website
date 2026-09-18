import { z } from "zod";
export const enquirySchema=z.object({
  name:z.string().trim().min(1,"Please enter your name.").max(100,"Name is too long."),
  phone:z.string().trim().min(1,"Please enter your phone number.").max(40,"Phone number is too long."),
  email:z.string().trim().email("Please enter a valid email.").max(254,"Email is too long.").or(z.literal("")),
  message:z.string().trim().min(1,"Please add a message or order.").max(3000,"Message is too long."),
});
export type Enquiry=z.infer<typeof enquirySchema>;
