import { z } from "zod";
export const enquirySchema=z.object({name:z.string().min(1,"Please enter your name."),phone:z.string().min(1,"Please enter your phone number."),email:z.string().email("Please enter a valid email.").or(z.literal("")),message:z.string().min(1,"Please add a message or order.")});
export type Enquiry=z.infer<typeof enquirySchema>;
