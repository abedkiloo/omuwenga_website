/**
 * Renders the careers listing and job detail pages from vacancies.js.
 * Each block runs only when its container is on the page.
 */
import { activeVacancies, vacancies } from "./vacancies.js";

function el(tag, { className, text, href, attrs } = {}, children = []) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  if (href) node.setAttribute("href", href);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  }
  for (const child of children) node.append(child);
  return node;
}

function paragraph(text, className) {
  return el("p", { className, text });
}

function bulletList(items) {
  return el("ul", {}, items.map((item) => el("li", { text: item })));
}

function metaList(job, titleCase) {
  const labels = titleCase
    ? ["Department", "Employment Type", "Work Arrangement", "Location"]
    : ["Department", "Employment type", "Work arrangement", "Location"];
  const values = [job.department, job.employmentType, job.workArrangement, job.location];
  return el(
    "dl",
    { className: "vacancy-meta" },
    labels.map((label, index) =>
      el("div", {}, [el("dt", { text: label }), el("dd", { text: values[index] })]),
    ),
  );
}

function jobHref(job) {
  return `${job.slug}/`;
}

function renderCard(job) {
  const href = jobHref(job);
  return el("article", { className: "vacancy-card" }, [
    el("p", { className: "vacancy-status", text: "Open position" }),
    el("h2", {}, [el("a", { href, text: job.title })]),
    metaList(job, false),
    paragraph(job.summary, "vacancy-summary"),
    el("a", { className: "button", href, text: "View Job Details" }),
  ]);
}

function renderListing() {
  const root = document.querySelector("[data-vacancy-list]");
  if (!root) return;

  const heading = root.querySelector("[data-vacancy-heading]");
  const cards = root.querySelector("[data-vacancy-cards]");
  if (!cards) return;

  const open = activeVacancies();
  if (heading) heading.textContent = open.length === 1 ? "Current vacancy" : "Current vacancies";

  if (!open.length) {
    cards.replaceChildren(paragraph("There are no open positions right now.", "live-status"));
    return;
  }

  if (cards.querySelector(".vacancy-card")) return;

  cards.replaceChildren();
  for (const job of open) cards.append(renderCard(job));
}

function mailtoHref(email, subject) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}

function renderApply(job) {
  const { email, subject, intro, include, only } = job.apply;
  const href = mailtoHref(email, subject);
  const address = href ? el("a", { href }) : el("strong");
  const at = email.indexOf("@");
  if (at === -1) {
    address.textContent = email;
  } else {
    address.append(email.slice(0, at + 1), document.createElement("wbr"), email.slice(at + 1));
  }
  const emailNode = el("p", { className: "apply-email" }, [address]);

  return el(
    "section",
    { className: "apply-panel", attrs: { id: "how-to-apply", "aria-labelledby": "how-to-apply-heading" } },
    [
      el("h2", { attrs: { id: "how-to-apply-heading" }, text: "How to Apply" }),
      paragraph(intro),
      emailNode,
      el("p", { className: "apply-subject" }, [
        el("strong", { text: `Email subject: ${subject}` }),
      ]),
      paragraph(include),
      paragraph(only),
    ],
  );
}

function renderDetail() {
  const page = document.querySelector("[data-vacancy-detail]");
  if (!page) return;

  const slug = page.getAttribute("data-slug");
  const job = vacancies.find((item) => item.slug === slug);
  const title = page.querySelector("[data-vacancy-title]");
  const hero = page.querySelector("[data-vacancy-hero]");
  const body = page.querySelector("[data-vacancy-body]");
  if (!hero || !body) return;

  if (!job || job.status !== "active") {
    if (title) title.textContent = job ? job.title : "Job not found";
    hero.replaceChildren(
      paragraph(job ? "This position is no longer open." : "This position is not listed."),
    );
    body.replaceChildren(
      paragraph(
        job
          ? "Applications are not being accepted for this role."
          : "Return to the careers page to see open positions.",
      ),
      el("a", { className: "button", href: "../", text: "Back to careers" }),
    );
    return;
  }

  if (title) title.textContent = job.title;
  if (body.childElementCount > 0) return;
  hero.replaceChildren(
    el("p", { className: "vacancy-status", text: "Open position" }),
    metaList(job, true),
  );

  body.replaceChildren(
    el("section", {}, [
      el("h2", { text: "About Omuwenga Suppliers" }),
      ...job.about.map((text) => paragraph(text)),
    ]),
    el("section", {}, [
      el("h2", { text: "Key Responsibilities" }),
      bulletList(job.responsibilities),
    ]),
    el("section", {}, [
      el("h2", { text: "Requirements and Qualifications" }),
      bulletList(job.requirements),
      ...job.requirementNotes.map((text) => paragraph(text)),
    ]),
    el("section", {}, [
      el("h2", { text: "What We Offer" }),
      paragraph(job.offer),
    ]),
    renderApply(job),
  );
}

renderListing();
renderDetail();
