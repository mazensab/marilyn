"use client";

import * as React from "react";
import {
  CalendarDays,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  PUBLIC_LOCALE_CHANGE_EVENT,
  readPublicLocale,
  type PublicLocale,
} from "@/lib/public-locale";
import {
  buildPublicWhatsAppUrl,
} from "@/lib/public-site-config";
import { cn } from "@/lib/utils";

type QuickReply = {
  label: string;
  message: string;
};

export function ChatWidget() {
  const [open, setOpen] =
    React.useState(false);

  const [locale, setLocale] =
    React.useState<PublicLocale>("ar");

  const [message, setMessage] =
    React.useState("");

  React.useEffect(() => {
    const syncLocale = () =>
      setLocale(readPublicLocale());

    syncLocale();

    window.addEventListener(
      PUBLIC_LOCALE_CHANGE_EVENT,
      syncLocale,
    );

    window.addEventListener(
      "storage",
      syncLocale,
    );

    return () => {
      window.removeEventListener(
        PUBLIC_LOCALE_CHANGE_EVENT,
        syncLocale,
      );

      window.removeEventListener(
        "storage",
        syncLocale,
      );
    };
  }, []);

  const isArabic = locale === "ar";

  const quickReplies: QuickReply[] =
    isArabic
      ? [
          {
            label: "أريد حجز موعد",
            message:
              "مرحبًا Marilyn Clinics، أريد حجز موعد.",
          },
          {
            label: "استفسار عن خدمة",
            message:
              "مرحبًا Marilyn Clinics، لدي استفسار عن إحدى الخدمات.",
          },
          {
            label: "أوقات ومواعيد",
            message:
              "مرحبًا Marilyn Clinics، أريد معرفة المواعيد المتاحة.",
          },
          {
            label: "موقع العيادة",
            message:
              "مرحبًا Marilyn Clinics، أريد معرفة موقع العيادة.",
          },
        ]
      : [
          {
            label: "Book appointment",
            message:
              "Hello Marilyn Clinics, I would like to book an appointment.",
          },
          {
            label: "Ask about a service",
            message:
              "Hello Marilyn Clinics, I have a question about a service.",
          },
          {
            label: "Available times",
            message:
              "Hello Marilyn Clinics, I would like to know the available appointment times.",
          },
          {
            label: "Clinic location",
            message:
              "Hello Marilyn Clinics, I would like to know the clinic location.",
          },
        ];

  const copy = isArabic
    ? {
        title: "تواصل مع Marilyn",
        subtitle:
          "نساعدك في الخدمات والحجز والمواعيد",
        greeting:
          "مرحبًا 👋 كيف نقدر نخدمك اليوم؟ اختر استفسارك أو اكتب رسالتك وسنجهزها لك على واتساب.",
        placeholder: "اكتب رسالتك...",
        send: "فتح واتساب",
        open: "تواصل معنا",
        close: "إغلاق",
        prepared: "تم تجهيز الرسالة.",
        noWhatsapp:
          "رقم واتساب لم يتم ضبطه في إعدادات الموقع بعد.",
      }
    : {
        title: "Chat with Marilyn",
        subtitle:
          "We can help with services and appointments",
        greeting:
          "Hello 👋 How can we help today? Choose a shortcut or write your message and we will prepare it for WhatsApp.",
        placeholder: "Write your message...",
        send: "Open WhatsApp",
        open: "Contact us",
        close: "Close",
        prepared: "Message prepared.",
        noWhatsapp:
          "The WhatsApp number has not been configured yet.",
      };

  const finalMessage =
    message.trim() ||
    (isArabic
      ? "مرحبًا Marilyn Clinics، أود الاستفسار."
      : "Hello Marilyn Clinics, I would like to ask a question.");

  const whatsappHref =
    buildPublicWhatsAppUrl(finalMessage);

  const openWhatsApp = () => {
    if (!whatsappHref) {
      toast.error(copy.noWhatsapp);
      return;
    }

    window.open(
      whatsappHref,
      "_blank",
      "noopener,noreferrer",
    );
  };

  if (!open) {
    return (
      <div
        dir={isArabic ? "rtl" : "ltr"}
        className="
          fixed bottom-5 left-5 z-50
          sm:bottom-6 sm:left-6
        "
      >
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="
            size-12 rounded-full
            p-0
            shadow-[0_12px_32px_rgba(15,23,42,0.22)]
            sm:size-13
          "
          aria-label={copy.open}
          title={copy.open}
        >
          <MessageCircle className="size-5" />
        </Button>
      </div>
    );
  }

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"}
      className="
        fixed bottom-5 left-5 z-50
        w-[calc(100vw-2.5rem)]
        sm:bottom-6 sm:left-6 sm:w-[380px]
      "
    >
      <Card className="
        overflow-hidden
        rounded-[26px]
        bg-background/96
        shadow-2xl
        backdrop-blur-xl
      ">
        <CardHeader className="border-b p-5">
          <div className="flex items-start justify-between gap-4">
            <div
              className={cn(
                isArabic
                  ? "text-right"
                  : "text-left",
              )}
            >
              <div className="flex items-center gap-2 text-sm font-bold">
                <Sparkles className="size-4 text-amber-700" />
                {copy.title}
              </div>

              <p className="text-muted-foreground mt-1 text-xs">
                {copy.subtitle}
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="size-8 rounded-full"
              aria-label={copy.close}
            >
              <X className="size-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-5">
          <div className="rounded-2xl bg-muted/50 p-4 text-sm leading-7">
            {copy.greeting}
          </div>

          <div className="flex flex-wrap gap-2">
            {quickReplies.map((item) => (
              <Button
                key={item.label}
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-full px-3 text-xs"
                onClick={() => {
                  setMessage(item.message);
                  toast.success(copy.prepared);
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              placeholder={copy.placeholder}
              className={cn(
                "h-11 rounded-2xl",
                isArabic
                  ? "text-right"
                  : "text-left",
              )}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  openWhatsApp();
                }
              }}
            />

            <Button
              type="button"
              size="icon"
              onClick={openWhatsApp}
              className="size-11 shrink-0 rounded-2xl"
              aria-label={copy.send}
            >
              <Send className="size-4" />
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-2xl"
            onClick={() => {
              window.location.href = "/book";
            }}
          >
            <CalendarDays className="size-4" />
            {isArabic
              ? "الحجز الإلكتروني"
              : "Online booking"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default ChatWidget;