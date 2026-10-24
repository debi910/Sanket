// Real photos from Wikimedia Commons, loaded from Commons at view time and
// credited with a link to each file page (author and licence are listed
// there). If a photo cannot load, the card falls back to a tinted panel.
const FILE = (name, w = 900) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=${w}`;
const PAGE = (name) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(name.replace(/ /g, "_"))}`;

export const PHOTOS = {
  subcentre: { file: "ASHA ANM Weekly Health Meeting Subcenter Kusumanchi.jpg", alt: "ASHA and ANM health workers at a weekly meeting in a sub-centre, Kusumanchi" },
  phc: { file: "Gangadharpur Primary health centre 1.jpg", alt: "Primary health centre building in Gangadharpur" },
  ambulance: { file: "The 108 Ambulance.jpg", alt: "A 108 emergency ambulance in India" },
  opd: { file: "Vanivilas OPD.jpg", alt: "Outpatient department at Vani Vilas Hospital, Bengaluru" }
};

export function photo(key, { w = 900, cls = "", caption = "" } = {}) {
  const p = PHOTOS[key];
  return `<figure class="photo ${cls}">
    <img src="${FILE(p.file, w)}" alt="${p.alt}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onload="this.parentNode.classList.add('in')" onerror="this.parentNode.classList.add('fail')">
    ${caption ? `<figcaption>${caption}</figcaption>` : ""}
    <a class="credit" href="${PAGE(p.file)}" target="_blank" rel="noopener">Photo: Wikimedia Commons</a>
  </figure>`;
}
