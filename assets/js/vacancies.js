/**
 * Vacancy records for /careers/.
 *
 * The listing renders a card for every entry with status "active".
 * The full description lives on careers/<slug>/index.html and must match
 * these fields. npm test fails if the page and this file diverge.
 *
 * Set status to "closed", or delete the entry, when recruitment ends.
 * With JavaScript on, a closed role leaves the listing and its page shows
 * a closed notice instead of the description.
 *
 * To add a role, append an object and copy careers/sales-representative/
 * to careers/<slug>/, then update data-slug and the page copy.
 * Display order is the order of this array.
 */

export const vacancies = [
  {
    slug: "sales-representative",
    status: "active",
    title: "Sales Representative",
    department: "Sales & Business Development",
    employmentType: "Full-time",
    workArrangement: "Field-based",
    location: "Nairobi, Kenya / assigned sales territory",
    summary:
      "We are looking for a proactive, confident and results-oriented Sales Representative to help us grow our customer base, develop business relationships and expand our reach in the furniture fittings and upholstery supplies market.",
    about: [
      "Omuwenga Suppliers is a furniture fittings and upholstery supplies business based in Gikomba, Nairobi. We serve furniture makers, upholsterers, carpenters, workshops, manufacturers, retailers, resellers and wholesalers with furniture fittings and accessories.",
      "We are looking for a proactive, confident and results-oriented Sales Representative to help us grow our customer base, strengthen customer relationships and expand our market reach.",
    ],
    responsibilities: [
      "Identify and approach potential customers, including furniture workshops, manufacturers, upholsterers, retailers and resellers.",
      "Conduct field visits to introduce the company's products and develop new business relationships.",
      "Understand customer needs and recommend relevant products.",
      "Build and maintain strong relationships with new and existing customers.",
      "Follow up on enquiries, negotiate with customers and convert sales opportunities.",
      "Generate repeat business through consistent customer engagement.",
      "Identify new markets and business development opportunities within the assigned territory.",
      "Gather customer feedback and monitor competitor activity.",
      "Prepare regular sales activity reports.",
      "Coordinate with the internal team to support customer enquiries and order fulfilment.",
    ],
    requirements: [
      "Strong communication and interpersonal skills.",
      "Confidence in approaching customers and presenting products.",
      "Good persuasion, negotiation and relationship-building skills.",
      "A proactive, self-motivated and results-oriented attitude.",
      "Willingness to work in the field and visit customers.",
      "Good organisation, follow-up and reporting skills.",
      "Basic smartphone and digital communication skills.",
      "Honesty, professionalism and a customer-focused mindset.",
    ],
    requirementNotes: [
      "Previous experience in field sales, business development, retail sales or selling to furniture makers, hardware businesses, workshops or retailers will be an advantage.",
      "An interest in learning about furniture fittings and upholstery products is important.",
    ],
    offer:
      "An opportunity to contribute to the growth of a business serving Kenya's furniture-making and upholstery industry, develop customer relationships and explore new market opportunities.",
    apply: {
      email: "omegaomegageneralsuppliers@gmail.com",
      subject: "Application \u2013 Sales Representative",
      intro: "Interested candidates should send their updated CV and a brief application letter to:",
      include:
        "Please include your full name, phone number, relevant sales experience and a short explanation of why you are suitable for the role.",
      only: "Only applications sent to the email address above will be considered.",
    },
  },
];

export function activeVacancies(list = vacancies) {
  return list.filter((job) => job && job.status === "active");
}
