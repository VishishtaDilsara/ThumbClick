"use client";
import axios from "axios";
import SectionTitle from "../components/SectionTitle";
import { ArrowRightIcon, MailIcon, UserIcon } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import toast from "react-hot-toast";

export default function ContactSection() {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);

  async function sendMessage() {
    if (!name || !email || !message) {
      toast.error("Please fill all the fields");
      return;
    }
    setSending(true);
    axios
      .post(import.meta.env.VITE_BASE_URL + "/api/user/send-message", {
        name: name,
        email: email,
        message: message,
      })
      .then((res) => {
        toast.success("Message sent successfully");
        setEmail("");
        setName("");
        setMessage("");
        setSending(false);
      })
      .catch((err) => {
        toast.error("Error sending message");
        console.log(err);
      });
  }
  return (
    <section id="contact">
      <div className="px-4 md:px-16 lg:px-24 xl:px-32">
        <SectionTitle
          text1="Contact"
          text2="Reach out to us"
          text3="Have questions about our AI? Ready to scale your views? Let's Talk"
        />
        <form
          onSubmit={(e) => e.preventDefault()}
          className="grid sm:grid-cols-2 gap-3 sm:gap-5 max-w-2xl mx-auto text-slate-300 mt-16 w-full"
        >
          <motion.div
            initial={{ y: 150, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 70,
              mass: 1,
            }}
          >
            <p className="mb-2 font-medium">Your name</p>
            <div className="flex items-center pl-3 rounded-lg border border-slate-700 focus-within:border-pink-500">
              <UserIcon className="size-5" />
              <input
                name="name"
                type="text"
                value={name}
                placeholder="Enter your name"
                className="w-full p-3 outline-none"
                onChange={(e) => {
                  setName(e.target.value);
                }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 150, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 70,
              mass: 1,
            }}
          >
            <p className="mb-2 font-medium">Email id</p>
            <div className="flex items-center pl-3 rounded-lg border border-slate-700 focus-within:border-pink-500">
              <MailIcon className="size-5" />
              <input
                name="email"
                type="email"
                value={email}
                placeholder="Enter your email"
                className="w-full p-3 outline-none"
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
              />
            </div>
          </motion.div>

          <motion.div
            className="sm:col-span-2"
            initial={{ y: 150, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{
              type: "spring",
              stiffness: 240,
              damping: 70,
              mass: 1,
            }}
          >
            <p className="mb-2 font-medium">Message</p>
            <textarea
              name="message"
              rows={8}
              placeholder="Enter your message"
              value={message}
              className="focus:border-pink-500 resize-none w-full p-3 outline-none rounded-lg border border-slate-700"
              onChange={(e) => {
                setMessage(e.target.value);
              }}
            />
          </motion.div>

          <motion.button
            onClick={sendMessage}
            type="submit"
            disabled={sending}
            className="w-max flex items-center gap-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-70 disabled:cursor-not-allowed text-white px-10 py-3 rounded-full"
            initial={{ y: 150, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 70,
              mass: 1,
            }}
          >
            {sending ? (
              "Submitting..."
            ) : (
              <>
                Submit
                <ArrowRightIcon className="size-5" />
              </>
            )}
          </motion.button>
        </form>
      </div>
    </section>
  );
}
