// Replace these with your real promo image URLs
const PROMO_IMAGES = [
  {
    src: "https://scontent.fpnh1-2.fna.fbcdn.net/v/t39.99422-6/726868848_2919129251771109_229754996216978784_n.png?stp=dst-jpg_tt6&cstp=mx2896x1448&ctp=s2896x1448&_nc_cat=111&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeE944HABMBrU2TFM7lnDl_lCYYudwGzMKoJhi53AbMwqqX68hB9-FwjFK9oUqLac8X8s8CHu7u1LWOBJw9-HaY3&_nc_ohc=s1_f26cEnNwQ7kNvwEDGEYp&_nc_oc=AdobCDVvrpmkUS5bNsJRJ8oSO7Z7hW3sfP0po_jQnqx2xjmwtUBHeAXuSUoES7OrK_s&_nc_zt=14&_nc_ht=scontent.fpnh1-2.fna&_nc_gid=_H9XrFCJC6e-ec8a1aBdwg&_nc_ss=7b2a8&oh=00_Af8XJX-BAMThdhf_eXFz1MfOdrsu_p8OHlSMNXSvb5kPdw&oe=6A43E523",
    title: "Happy Father's Day",
    tag: "Father's Day",
  },
  {
    src: "https://scontent.fpnh1-1.fna.fbcdn.net/v/t39.99422-6/719218759_1701479621096188_420555375382499222_n.png?stp=dst-jpg_tt6&cstp=mx1080x1244&ctp=s1080x1244&_nc_cat=106&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeGCoG3-6mM0KfQgnWaZuxSASLrecZ1NGJ9Iut5xnU0Yn3IsyTYnK-G0fH_qDcQRsskGiQvzOaeLSqoDtFfAMo29&_nc_ohc=4ckRblAqOwoQ7kNvwEgJByM&_nc_oc=Adp2wHoKntMJERGkw1AQL9qKgIzJEYWHJ_JnLupHeZTQNtIyzusqQQt13wsanx4QVw4&_nc_zt=14&_nc_ht=scontent.fpnh1-1.fna&_nc_gid=Yyp6i-45Ovy5hm8gLsxJIA&_nc_ss=7b2a8&oh=00_Af9B0S5IFjglPzP_Flvm_50W6psLRj0LtOAmzQT4EKjgWg&oe=6A43FE93",
    title: "Siem Reap Express Now Open",
    tag: "New Route",
  },
  {
    src: "https://scontent.fpnh1-1.fna.fbcdn.net/v/t39.30808-6/704467899_122170329038930524_5024689999608613795_n.jpg?stp=dst-jpg_tt6&cstp=mx2000x2000&ctp=s2000x2000&_nc_cat=105&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeFY6tDgLUVgkK-u45XLoRFOWiNwA8_lyI9aI3ADz-XIj2v5hA8i6fLPf-lNhg1zpfHcqidIeT1hjNPuZgqNqSI2&_nc_ohc=J52EpmBHFZ4Q7kNvwFQdhL1&_nc_oc=AdpmqjiD5ENWzmFrKjqU00YdQDBPPtpbV83PDpcAIwUb07U-p5XJ_NV897o7Dx6Sj7w&_nc_zt=23&_nc_ht=scontent.fpnh1-1.fna&_nc_gid=KTEVFScz_hwg7R-MAbRMMQ&_nc_ss=7b2a8&oh=00_Af8SBfBNveN9MqVFH5vXaEjRB6rML3BICwdLiEhB6bPSzQ&oe=6A440F15",
    title: "Sihanoukville Weekend Getaway",
    tag: "Promo",
  },
  {
    src: "https://scontent.fpnh1-1.fna.fbcdn.net/v/t39.30808-6/701123181_122169944774930524_7382350094244258584_n.jpg?stp=dst-jpg_tt6&cstp=mx1333x1333&ctp=s1333x1333&_nc_cat=104&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeHR2dsCxX8pBk2y_KtXDGlM5Wz3kzzxML7lbPeTPPEwvtv-OeRjfsm9iC4Oo6maKvDK8XYl8cV5C8egacxMtfrF&_nc_ohc=VlhjYc5OnY0Q7kNvwHiaoJA&_nc_oc=AdqjrGSwkhJdcZFdjCF1g4Cv0Zu3MvWyQauVnwPDvecwVQB9YB_o-slmnN1kekcGiUs&_nc_zt=23&_nc_ht=scontent.fpnh1-1.fna&_nc_gid=L6-gJWncKa1pJwQ1LDCl_w&_nc_ss=7b2a8&oh=00_Af9UIhOVZkG6kV-KB6_W0VdoARUtCVeJubltR4i7NvPqjQ&oe=6A44072A",
    title: "Book Early, Save More",
    tag: "Save 20%",
  },
  {
    src: "https://scontent.fpnh1-2.fna.fbcdn.net/v/t39.30808-6/696734506_122168990546930524_7695005599975160121_n.jpg?stp=dst-jpg_tt6&cstp=mx1706x2048&ctp=s1706x2048&_nc_cat=101&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeHOs2wwgcASoHn3GEOb6St0D4BzF28MrhEPgHMXbwyuEaLhvlwk2dOxDfh-XjEcf1X6uduxAzwuWipWCpKT91l_&_nc_ohc=35KlI95_l-YQ7kNvwEVjfLO&_nc_oc=AdrQg9iHOoMvnVUj4Tcok2Dt5K3sl7Xkh4sgQR2fp3hIFkRSFWjwWjewJ2P_1cFx48g&_nc_zt=23&_nc_ht=scontent.fpnh1-2.fna&_nc_gid=n49VsVSs6marrIu7NmI66g&_nc_ss=7b2a8&oh=00_Af-lVU5xlauae7gpPc7GxiC577M766rdSAbT-GvcyDzckw&oe=6A441CE9",
    title: "",
    tag: "",
  },
  {
    src: "https://scontent.fpnh1-2.fna.fbcdn.net/v/t39.30808-6/695960239_122169026366930524_3462407243743375283_n.jpg?stp=dst-jpg_tt6&cstp=mx1903x2048&ctp=s1903x2048&_nc_cat=103&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeEBiu-QKcxyiW8VQYNE2-s96PVoroAF99Ho9WiugAX30eg2AzPTuGigEpGtyBGBvXKS6vJGcYrsK2iN7cR0u9fh&_nc_ohc=SYT4hSbyWCsQ7kNvwGJQs4u&_nc_oc=Ado2GfrWSbsfzoyE9xXyzqPr8eU-3xsaaqSLf6mIOcUqE1ZOE9tFqpGX3pAAVl_V71k&_nc_zt=23&_nc_ht=scontent.fpnh1-2.fna&_nc_gid=-hwgUZqA5-HiDOiKn15YhA&_nc_ss=7b2a8&oh=00_Af92p4OnQ46sbdZdI8QCai5sylAH9PGogW14v4QDgfdbxw&oe=6A43F26C",
    title: "",
    tag: "",
  },
  {
    src: "https://scontent.fpnh1-1.fna.fbcdn.net/v/t39.30808-6/688932860_122168509016930524_5554088418442085948_n.jpg?stp=dst-jpg_tt6&cstp=mx1903x2048&ctp=s1903x2048&_nc_cat=105&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeFNYl_XmpqE2JeChtDPJ0I6EgaGNPE99HYSBoY08T30dsRHEX6HsRgfyASfiv7jvkdASDS1Ncv0f87c4phXlWZO&_nc_ohc=TAiDFl3Xfo4Q7kNvwG0TBO2&_nc_oc=Adq4tIrgLi0RxUspXrh8bog9tzGuEp0RSbIV1DdIvfEwTovOy6dc_wyrhUa4XlYFA60&_nc_zt=23&_nc_ht=scontent.fpnh1-1.fna&_nc_gid=KqDVVRJFq7eVc0p6UzjOAA&_nc_ss=7b2a8&oh=00_Af8Le1W55OCKVl3LmT_twjfprgbJtqp1WjozOfAkTJ75uA&oe=6A441208",
    title: "",
    tag: "",
  },
  {
    src: "https://scontent.fpnh1-2.fna.fbcdn.net/v/t39.30808-6/681435450_122163201704930524_2031010339006303101_n.jpg?stp=dst-jpg_tt6&cstp=mx1903x2048&ctp=s1903x2048&_nc_cat=103&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeHOCejR4PFDSJ4yA-cr1KxUpS4qqB9iX8-lLiqoH2Jfz-1sbQDtpGSxCnIdgQy6PDesGA-ikj7dp81zxVGX9hyR&_nc_ohc=jijbM17qO0kQ7kNvwGRUGZA&_nc_oc=Adp4c8IB-tQB3HJUQVF1goD6z0W2X9bXSXrBYvY24dQ_-UMTt5M00WfIbH2Kodh6Nj8&_nc_zt=23&_nc_ht=scontent.fpnh1-2.fna&_nc_gid=NWer8An9Mh5aOsHx5W6brQ&_nc_ss=7b2a8&oh=00_Af-NPIXGYI93T11R9HhVa7YeTbVT7q5FFdMEJ8OTLuyn6Q&oe=6A43EC79",
    title: "",
    tag: "",
  },
  {
    src: "https://scontent.fpnh1-1.fna.fbcdn.net/v/t39.30808-6/658133175_122160127694930524_6280922826816495072_n.jpg?stp=dst-jpg_tt6&cstp=mx1903x2048&ctp=s1903x2048&_nc_cat=102&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeFVaghJIN-aJGCeHCwlVY6qPY4qg7fFEd09jiqDt8UR3YytiRG8utgsO44uPXS5jq33olAvbZcrgxThL1GCYQ8x&_nc_ohc=YNSgT-qtHIcQ7kNvwHRobNh&_nc_oc=AdoH3Rq58cKWO5Zhk2abCGV4OKNJH3n2z5f6XIS9FXmcWir91F_1DN7U6A2_WHy3iEg&_nc_zt=23&_nc_ht=scontent.fpnh1-1.fna&_nc_gid=UqtT8Bw1y6li9gay7ZNxhQ&_nc_ss=7b2a8&oh=00_Af9omdGpZrKggNfbsZwo3thbUGt6yPgnLqyPNJsAUI5UgA&oe=6A4419DD",
    title: "",
    tag: "",
  },
  {
    src: "https://scontent.fpnh1-2.fna.fbcdn.net/v/t39.30808-6/651009201_122157313316930524_5414813989880167356_n.jpg?stp=dst-jpg_tt6&cstp=mx1903x2048&ctp=s1903x2048&_nc_cat=111&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeH7J6HLK5EcUNf2rTrPu-9QRoXHRtIQ2vpGhcdG0hDa-vO3YfJgusL7Zk2kQwlEt4Dl0eT_aLLVkYYNK0ywIHj-&_nc_ohc=0Qnvt9T0FboQ7kNvwG76U_Z&_nc_oc=AdpGHbF1IC5mtILpqVGSZyw7ET_ki6AwG9cmQ5ZhMH-4JXMisScz3HCtrYEEpeItfYg&_nc_zt=23&_nc_ht=scontent.fpnh1-2.fna&_nc_gid=BDByBSUHepOuAC1MT2mIhA&_nc_ss=7b2a8&oh=00_Af-AGHRJiyDGU2ZHCBN-EvlEYZilczuC_9hd6t96Dn2SAQ&oe=6A44056C",
    title: "",
    tag: "",
  },
];

const VISIBLE_WITHOUT_SCROLL = 5;

export default function NewsPromotions() {
  const needsAutoScroll = PROMO_IMAGES.length > VISIBLE_WITHOUT_SCROLL;

  // Duplicate the list so the marquee can loop seamlessly with no visible seam
  const marqueeItems = needsAutoScroll
    ? [...PROMO_IMAGES, ...PROMO_IMAGES]
    : PROMO_IMAGES;

  return (
    <section className="news-promo-section">
      <h2 className="news-promo-heading">News &amp; Promotions</h2>

      <div className={`news-promo-viewport ${needsAutoScroll ? "scrolling" : ""}`}>
        {needsAutoScroll && (
          <>
            <div className="news-promo-fade left" />
            <div className="news-promo-fade right" />
          </>
        )}

        <div
          className={`news-promo-track ${needsAutoScroll ? "auto-scroll" : "static-grid"}`}
        >
          {marqueeItems.map((item, i) => (
            <div className="news-promo-card" key={`${item.title}-${i}`}>
              <img src={item.src} alt={item.title} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}