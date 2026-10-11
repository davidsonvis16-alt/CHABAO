import { Link } from 'react-router-dom';
import { BUSINESS, hoursFor, openStatus } from '../data/menu';
import { PageHero, Reveal } from '../components/Chrome';
import { Img } from '../components/Img';
import { Icon } from '../components/Drawings';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Visit() {
  const today = new Date().getDay();
  const s = openStatus();
  return (
    <>
      <PageHero eyebrow="Find us" title={<>Come <em>hungry.</em></>} image="/images/site/visit-hero.jpg" cn="来">
        <p className={`status-pill big`}><i className={s.open ? 'on' : ''} />{s.text}</p>
      </PageHero>
      <section className="section">
        <div className="wrap visit-grid">
          <Reveal className="visit-info">
            <div className="visit-block"><p className="eyebrow">Address</p><p className="big-line">{BUSINESS.address}</p>
              <a className="link-underline" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(BUSINESS.mapQuery)}`} target="_blank" rel="noreferrer">Directions</a></div>
            <div className="visit-block"><p className="eyebrow">Call or message</p>
              <p className="big-line"><a href={`tel:${BUSINESS.phone.replace(/\s/g, '')}`}>{BUSINESS.phone}</a></p>
              <p><a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a></p></div>
            <div className="visit-block">
              <p className="eyebrow">Hours</p>
              <table className="hours-table">
                <tbody>
                  {DAYS.map((d, i) => {
                    const idx = (i + 1) % 7;
                    const h = hoursFor(idx);
                    return (<tr key={d} className={idx === today ? 'today' : ''}><th>{d}</th><td>{h ? `${h.open} – ${h.close}` : 'Closed'}</td></tr>);
                  })}
                </tbody>
              </table>
            </div>
          </Reveal>
          <Reveal className="map-frame" delay={0.1}>
            <iframe title="Map to Cha Bao" src={`https://www.google.com/maps?q=${encodeURIComponent(BUSINESS.mapQuery)}&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </Reveal>
        </div>
      </section>
      <section className="section section-events">
        <div className="wrap events-grid">
          <Reveal className="events-img"><Img src="/images/site/private-dining.jpg" alt="Long table set for a private dinner" /></Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow">Private dining & events</p>
            <h2>The whole lazy Susan, <em>just for you.</em></h2>
            <p className="muted">Birthdays, launches, team dinners — we build a sharing menu around your night, with tea pairings and the lanterns turned low.</p>
            <div className="hero-actions">
              <a className="btn btn-fill" href={`https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent('Hi Cha Bao, I’d like to ask about private dining.')}`} target="_blank" rel="noreferrer">Enquire <Icon.arrow /></a>
              <Link className="btn btn-ghost" to="/reserve">Book a table</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
