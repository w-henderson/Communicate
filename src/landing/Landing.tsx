import React from "react";
import "../styles/Landing.scss";

import googleSignInButton from '../images/google_sign_in.png';
import githubSignInButton from '../images/github_sign_in.png';
import icon from '../images/icon_transparent.png';
import phoneMockup from '../images/phone_mockup.png';

import Icon from "../components/Icon";

interface LandingProps {
  callback: (provider: "Google" | "GitHub") => void;
}

class Landing extends React.Component<LandingProps> {
  entryRef: React.RefObject<HTMLElement>;

  constructor(props) {
    super(props);

    this.entryRef = React.createRef();
  }

  render() {
    return (
      <div className="Landing">
        <nav>
          <img src={icon} alt="Communicate icon" />
          <span>Communicate</span>
          <div>
            <div><Icon onClick={() => this.props.callback("Google")}>google</Icon></div>
            <div><Icon onClick={() => this.props.callback("GitHub")}>github</Icon></div>
          </div>
        </nav>

        <section className="hero">
          <div className="heroContent">
            <h1>Communicate</h1>
            <div className="subtitle">The easiest way to stay in touch.</div>

            {window.innerWidth > 900 && <div className="overview">
              Unlimited conversations • Secure messaging<br />
              Instant communication • Intuitive and stylish interface<br />
              Reliable • Completely free for everyone
            </div>}

            {window.innerWidth <= 900 && <div className="overview">
              • Unlimited conversations<br />
              • Secure messaging<br />
              • Instant communication<br />
              • Intuitive and stylish interface<br />
              • Highly reliable<br />
              • Completely free for everyone
            </div>}

            <div className="buttons">
              <button onClick={() => this.props.callback("Google")}>Sign in with Google</button>
              <button onClick={() => this.entryRef.current?.scrollIntoView({ behavior: "smooth" })}>More Info</button>
            </div>
          </div>

          <div className="heroImage">
            <img src={phoneMockup} alt="Screenshot of Communicate" />
          </div>
        </section>

        <section ref={this.entryRef}>
          <h1>What is Communicate?</h1>
          Communicate a simple and intuitive chat app, providing an easy way to stay in touch with friends, family and anyone else. It has a modern and stylish interface, a reliable and secure Google-provided back-end, and is built using the latest web technologies. Whether you're planning a trip with your friends, or organising a project with your colleagues, Communicate connects you together to help you get stuff done.
        </section>

        <section>
          <h1>Features</h1>
          Communicate offers everything you need to keep in touch, including:

          <ul>
            <li>Instant communication across the world</li>
            <li>Intuitive, stylish, and easy-to-use interface</li>
            <li>Google-backed security keeping all your data private</li>
            <li>Available in a web browser or as an app on a wide range of devices</li>
          </ul>
        </section>
      </div>
    )

    /*
    return (
      <div className="SignIn">
        <img src={googleSignInButton} alt="Sign in with Google" onClick={() => this.props.callback("Google")} draggable={false} />
        <img src={githubSignInButton} alt="Sign in with GitHub" onClick={() => this.props.callback("GitHub")} draggable={false} />
      </div>
    )
    */
  }
}

export default Landing;
