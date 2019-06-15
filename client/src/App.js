import React, { Component } from "react";
import "./App.css";

/**
 * Client app component.
 */
class App extends Component {
  // The URL of the server for authenticating the client
  static AUTHENTICATE_SPOTIFY_URL = "http://localhost:5000/login";

  /**
   * Instantiates the app state. The app state stores whether or not the user
   * has authenticated with Spotify.
   */
  constructor() {
    super();
    const PARAMS = new URLSearchParams(window.location.search);

    // Check if the user is authenticated from the URL arguments
    this.isAuthenticated = PARAMS.get("authenticated") === "true";
    console.log(`isAuthenticated? ${this.isAuthenticated}`);
  }

  /**
   * Sets the page title.
   */
  componentDidMount() {
    document.title = "Smart Spotify Playlists";
  }

  /**
   * Renders the client app.
   */
  render() {
    // If the user has authenticated, returns a new line.
    // Otherwise, prompts the user to authenticate with Spotify.
    const authenticateSpotify = this.isAuthenticated ? (
      <br />
    ) : (
      <a
        href={App.AUTHENTICATE_SPOTIFY_URL}
        className="spotifyAuthenticationURL"
      >
        Connect with Spotify
      </a>
    );

    return (
      <div className="App">
        {/* Renders the page statics (title & description) */}
        <header className="header">
          <h1 className="title">Smart Spotify Playlists</h1>
          <p className="description">
            Create Spotify playlists based on music rules
            <br />
            Inspired by iTunes Smart Playlists
          </p>
        </header>

        {/* Renders the spotify authentication link, if necessary */}
        <div className="spotifyAuthentication">{authenticateSpotify}</div>
      </div>
    );
  }
}

export default App;
