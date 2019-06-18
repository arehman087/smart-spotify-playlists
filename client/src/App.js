import React, { Component } from "react";
import "./App.css";
import SpotifyAPI from "./SpotifyAPI";

require("dotenv").config();

/**
 * Client app component.
 */
class App extends Component {
  /**
   * Instantiates the app state. The app state stores whether or not the user
   * has authenticated with Spotify.
   */
  constructor() {
    super();
    const PARAMS = new URLSearchParams(window.location.hash.substr(1));

    // Check if the user is authenticated from the URL arguments
    this.accessToken = PARAMS.get("access_token");
    this.isAuthenticated = this.accessToken !== null;
    this.api = this.isAuthenticated ? new SpotifyAPI(this.accessToken) : null;
    console.log(`accessToken = ${this.accessToken}`);

    // Temporarily log all of the info...
    if (this.api) {
      this.api.getLibraryTracksJSON().then(
        resolved => {
          let tracks = resolved;
          console.log("got user's songs");
          console.log(resolved);

          let trackIds = tracks.map(track => track.track.id);
          console.log(trackIds);
          this.api.getAudioFeaturesJSON(trackIds).then(
            resolved => {
              let features = resolved;

              console.log("got user's songs audio features");
              console.log(resolved);

              let merged = this.api.mergeTracksWithFeatures(tracks, features);
              console.log("merged the user's songs & audio features");
              console.log(merged);
            },
            rejected => {
              console.error("failed to get user's songs audio features");
              console.log(rejected);
            }
          );
        },
        rejected => {
          console.error("failed to get user's songs");
          console.log(rejected);
        }
      );
    }

    window.location.hash = "";
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
        href={this.getAuthenticationEndpoint()}
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

  /**
   * Returns the endpoint URL for authenticating the user with Spotify.
   */
  getAuthenticationEndpoint() {
    let endpoint = process.env.REACT_APP_AUTHENTICATION_ENDPOINT;
    let client_id = process.env.REACT_APP_AUTHENTICATION_CLIENT_ID;
    let redirect_uri = process.env.REACT_APP_AUTHENTICATION_REDIRECT_URI;
    let scopes = process.env.REACT_APP_AUTHENTICATION_SCOPES;

    let params = new URLSearchParams({
      client_id: client_id,
      response_type: "token",
      redirect_uri: redirect_uri,
      scope: scopes,
      show_dialog: false
    }).toString();

    console.log(`${endpoint}?${params}`);
    return `${endpoint}?${params}`;
  }
}

export default App;
