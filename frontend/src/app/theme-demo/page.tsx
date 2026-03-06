import Image from "next/image";
import Link from "next/link";
import { Be_Vietnam_Pro, Noto_Serif } from "next/font/google";
import { CalendarDays, GitBranchPlus, Sparkles, Users } from "lucide-react";
import styles from "./theme-demo.module.css";

const bodyFont = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  variable: "--font-demo-body",
  weight: ["400", "500", "600", "700"],
});

const headingFont = Noto_Serif({
  subsets: ["latin", "vietnamese"],
  variable: "--font-demo-heading",
  weight: ["600", "700"],
});

const featureCards = [
  {
    title: "Cay gia pha",
    description: "Hien thi pha he theo doi, nhanh va lien ket cha con theo bo cuc de doc.",
    icon: GitBranchPlus,
  },
  {
    title: "Lich cung le",
    description: "Tap trung cac ngay gio quan trong, bao truoc va nhac lich sinh hoat dong toc.",
    icon: CalendarDays,
  },
  {
    title: "Thanh vien",
    description: "To chuc danh ba, thong tin co ban va quan he giua cac nhanh trong dong ho.",
    icon: Users,
  },
];

export default function ThemeDemoPage() {
  return (
    <div className={`${styles.root} ${bodyFont.variable} ${headingFont.variable}`}>
      <div className={styles.shell}>
        <div className={styles.topBar}>
          <span className={styles.badge}>Demo Theme Viet</span>
          <Link href="/" className={styles.topLink}>
            Quay ve trang chu
          </Link>
        </div>

        <section className={styles.hero}>
          <div className={styles.heroTemple}>
            <Image
              src="/tree-assets/temple-header-trim.png"
              alt="Trang tri mai dinh"
              fill
              sizes="(max-width: 768px) 92vw, 360px"
              priority
            />
          </div>

          <div className={styles.titleWrap}>
            <p className={styles.caption}>Gia pha dien tu</p>
            <h1 className={styles.heading}>Dao Toc - Ninh Thon</h1>
          </div>

          <p className={styles.subHeading}>&ldquo;Giu nep nha - Nho tien nhan - Day con chau&rdquo;</p>

          <div className={styles.heroActions}>
            <Link href="/tree" className={styles.actionPrimary}>
              Xem cay gia pha
            </Link>
            <Link href="/people" className={styles.actionSecondary}>
              Xem danh sach thanh vien
            </Link>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Thanh phan giao dien mau</h2>
          <div className={styles.cards}>
            {featureCards.map((card) => (
              <article key={card.title} className={styles.card}>
                <div className={styles.cardHeader}>
                  <card.icon size={18} />
                  <h3>{card.title}</h3>
                </div>
                <p>{card.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Bang thong ke thu nghiem</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Chi nhanh</th>
                  <th>Doi hien thi</th>
                  <th>Thanh vien</th>
                  <th>Trang thai</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Chi Truong</td>
                  <td>01 - 08</td>
                  <td>56</td>
                  <td>Dang cap nhat</td>
                </tr>
                <tr>
                  <td>Chi Thu</td>
                  <td>02 - 07</td>
                  <td>41</td>
                  <td>On dinh</td>
                </tr>
                <tr>
                  <td>Chi Uc</td>
                  <td>03 - 06</td>
                  <td>29</td>
                  <td>Can bo sung ho so</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Muc tieu theme sau khi ap toan bo</h2>
          <div className={styles.comparison}>
            <div className={styles.comparisonBox}>
              <h4>
                <Sparkles size={15} style={{ marginRight: 6, verticalAlign: "-2px" }} />
                Ban demo nay
              </h4>
              <p>
                Tong the theo huong giay do son vang, dang chu co than thai gia pha, nhan dien dong bo
                tu hero, card den bang du lieu.
              </p>
            </div>
            <div className={styles.comparisonBox}>
              <h4>Buoc tiep theo</h4>
              <p>
                Dua token mau + typography vao globals, sau do ap cho auth, sidebar, page list va admin de
                giu mot ngon ngu thi giac thong nhat.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
