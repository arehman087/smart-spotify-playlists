import React from "react";
import App from "./App";

import Enzyme from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import { shallow } from "enzyme";
Enzyme.configure({ adapter: new Adapter() });

describe("constructor", () => {
  it("should get authentication token", () => {
    jest
      .spyOn(URLSearchParams.prototype, "get")
      .mockImplementation(() => "mock_token");

    let app = new App();
    expect(app.isAuthenticated).toBe(true);
    expect(app.accessToken).toBe("mock_token");
  });

  it("should set isAuthenticated=false when param authenticated!=true", () => {
    jest.spyOn(URLSearchParams.prototype, "get").mockImplementation(() => null);

    let app = new App();
    expect(app.isAuthenticated).toBe(false);
    expect(app.accessToken).toBe(null);
  });
});

describe("componentDidMount", () => {
  it("should set page title", () => {
    shallow(<App />);
    expect(document.title).toBe("Smart Spotify Playlists");
  });
});

describe("render", () => {
  it("should render app title and app description", () => {
    let wrapper = shallow(<App />);
    let header = wrapper.find("header");

    expect(header.children().length).toBe(2);
    expect(header.find(".title").exists()).toBe(true);
    expect(header.find(".description").exists()).toBe(true);
  });

  describe("render authentication", () => {
    it("should render connect to spotify when not authenticated", () => {
      jest
        .spyOn(URLSearchParams.prototype, "get")
        .mockImplementation(() => null);

      expect(
        shallow(<App />)
          .find(".spotifyAuthenticationURL")
          .exists()
      ).toBe(true);
    });

    it("should render connected to spotify when authenticated", () => {
      jest
        .spyOn(URLSearchParams.prototype, "get")
        .mockImplementation(() => "mock_token");

      expect(
        shallow(<App />)
          .find(".spotifyAuthenticationURL")
          .exists()
      ).toBe(false);
    });
  });
});

describe("authentication", () => {
  it("should get authentication endpoint url", () => {
    const OLD_ENV = process.env;

    process.env.REACT_APP_AUTHENTICATION_ENDPOINT =
      "http://www.testendpoint.com";
    process.env.REACT_APP_AUTHENTICATION_REDIRECT_URI =
      "http://www.redirect.com";
    process.env.REACT_APP_AUTHENTICATION_CLIENT_ID = "mock_client_id";
    process.env.REACT_APP_AUTHENTICATION_SCOPES = "scope1 scope2 scope3";

    expect(new App().getAuthenticationEndpoint()).toBe(
      "http://www.testendpoint.com?client_id=mock_client_id&response_type=token&redirect_uri=http%3A%2F%2Fwww.redirect.com&scopes=scope1+scope2+scope3&show_dialog=false"
    );

    process.env = OLD_ENV;
  });
});
