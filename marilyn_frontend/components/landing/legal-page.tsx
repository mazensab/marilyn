import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  ShieldCheck,
} from "lucide-react";

type LegalSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

type LegalPageProps = {
  isArabic: boolean;
  eyebrow: string;
  title: string;
  description: string;
  sections: LegalSection[];
  lastUpdated: string;
};

export function LegalPage({
  isArabic,
  eyebrow,
  title,
  description,
  sections,
  lastUpdated,
}: LegalPageProps) {
  const ArrowIcon = isArabic
    ? ArrowLeft
    : ArrowRight;

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="
        min-h-screen
        bg-[#f8f2e9]
        pt-24
        text-[#172238]

        sm:pt-28
      "
    >
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -start-24
            top-8
            size-72
            rounded-full
            border
            border-white/55
            bg-white/20
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -end-24
            top-56
            size-80
            rounded-full
            border
            border-[#d3b98f]/25
            bg-[#e9d9c2]/25
          "
        />

        <div className="container relative py-10 sm:py-14 lg:py-16">
          <header className="mx-auto max-w-3xl text-center">
            <div
              className="
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-[#cbb58f]/45
                bg-white/65
                px-3.5
                py-1.5
                text-xs
                font-semibold
                text-[#9a7138]
                shadow-[0_6px_18px_rgba(92,67,38,0.05)]
                backdrop-blur-xl
              "
            >
              <ShieldCheck className="size-3.5" />
              {eyebrow}
            </div>

            <h1
              className="
                mt-4
                text-3xl
                font-semibold
                tracking-[-0.035em]

                sm:text-4xl
                lg:text-[2.8rem]
              "
            >
              {title}
            </h1>

            <p
              className="
                mx-auto
                mt-4
                max-w-2xl
                text-sm
                leading-7
                text-[#68717f]

                sm:text-base
              "
            >
              {description}
            </p>

            <div
              className="
                mt-5
                inline-flex
                items-center
                gap-2
                text-xs
                text-[#7b8593]
              "
            >
              <FileText className="size-3.5 text-[#b48745]" />

              <span>
                {isArabic
                  ? "آخر تحديث:"
                  : "Last updated:"}
              </span>

              <span dir="ltr">
                {lastUpdated}
              </span>
            </div>
          </header>

          <article
            className="
              mx-auto
              mt-10
              max-w-4xl
              rounded-[30px]
              border
              border-[#cbbda9]/45
              bg-white/72
              px-5
              py-7
              shadow-[0_18px_52px_rgba(83,61,35,0.07)]
              backdrop-blur-xl

              sm:px-8
              sm:py-9

              lg:px-10
              lg:py-10
            "
          >
            <div className="space-y-9">
              {sections.map((section) => (
                <section
                  key={section.title}
                  className="
                    border-b
                    border-[#d9c8b2]/40
                    pb-8
                    last:border-b-0
                    last:pb-0
                  "
                >
                  <h2
                    className="
                      text-lg
                      font-semibold
                      tracking-[-0.02em]
                      text-[#10213b]

                      sm:text-xl
                    "
                  >
                    {section.title}
                  </h2>

                  {section.paragraphs?.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="
                        mt-3
                        text-sm
                        leading-8
                        text-[#626d7b]

                        sm:text-[15px]
                      "
                    >
                      {paragraph}
                    </p>
                  ))}

                  {section.items?.length ? (
                    <ul className="mt-4 space-y-3">
                      {section.items.map((item) => (
                        <li
                          key={item}
                          className="
                            flex
                            items-start
                            gap-3
                            text-sm
                            leading-7
                            text-[#626d7b]

                            sm:text-[15px]
                          "
                        >
                          <span
                            aria-hidden="true"
                            className="
                              mt-[11px]
                              size-1.5
                              shrink-0
                              rounded-full
                              bg-[#b48745]
                            "
                          />

                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>

            <div
              className="
                mt-10
                flex
                flex-col
                gap-3
                rounded-[22px]
                border
                border-[#d2bea0]/45
                bg-[#fbf6ee]/80
                px-5
                py-5

                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div>
                <p className="text-sm font-semibold text-[#10213b]">
                  {isArabic
                    ? "هل لديك استفسار؟"
                    : "Have a question?"}
                </p>

                <p className="mt-1 text-xs leading-6 text-[#707a87]">
                  {isArabic
                    ? "يمكنك التواصل مع Marilyn Clinics بشأن هذه السياسة أو بياناتك."
                    : "Contact Marilyn Clinics regarding this policy or your personal data."}
                </p>
              </div>

              <Link
                href="/contact"
                className="
                  inline-flex
                  items-center
                  gap-2
                  text-sm
                  font-semibold
                  text-[#8e6936]
                  transition
                  hover:text-[#a57b3d]
                "
              >
                {isArabic
                  ? "تواصل معنا"
                  : "Contact us"}

                <ArrowIcon className="size-4" />
              </Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
