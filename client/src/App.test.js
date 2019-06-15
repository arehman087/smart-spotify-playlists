import React from "react";
import App from "./App";

import Enzyme from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import { shallow } from "enzyme";
Enzyme.configure({ adapter: new Adapter() });

describe("constructor", () => {
  it("should set isAuthenticated=true when param authenticated=true", () => {
    jest
      .spyOn(URLSearchParams.prototype, "get")
      .mockImplementation(() => "true");

    expect(new App().isAuthenticated).toBe(true);
  });

  it("should set isAuthenticated=false when param authenticated!=true", () => {
    jest.spyOn(URLSearchParams.prototype, "get").mockImplementation(() => null);

    expect(new App().isAuthenticated).toBe(false);
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
        .mockImplementation(() => "false");

      expect(
        shallow(<App />)
          .find(".spotifyAuthenticationURL")
          .exists()
      ).toBe(true);
    });

    it("should render connected to spotify when authenticated", () => {
      jest
        .spyOn(URLSearchParams.prototype, "get")
        .mockImplementation(() => "true");

      expect(
        shallow(<App />)
          .find(".spotifyAuthenticationURL")
          .exists()
      ).toBe(false);
    });
  });
});
