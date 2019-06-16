import SpotifyAPI from "./SpotifyAPI";
import SpotifyWebApi from "spotify-web-api-js";
import { AssertionError } from "assert";

var faker = require("faker");

describe("constructor", () => {
  it("should construct SpotifyWebApi", () => {
    expect(new SpotifyAPI("mock_token").api.getAccessToken()).toBe(
      "mock_token"
    );
  });
});

describe("getLibraryTracksJSON", () => {
  it("should return null when error from SpotifyWebApi", () => {
    expect.assertions(1);
    jest
      .spyOn(SpotifyWebApi.prototype, "getMySavedTracks")
      .mockImplementation(() => {
        return new Promise(function(resolve, reject) {
          reject("");
        });
      });

    return expect(new SpotifyAPI("").getLibraryTracksJSON()).resolves.toBe(
      null
    );
  });

  it("should return single chunk when SpotifyWebApi returns single chunk", () => {
    expect.assertions(1);
    jest
      .spyOn(SpotifyWebApi.prototype, "getMySavedTracks")
      .mockImplementation(() => {
        return new Promise(function(resolve, reject) {
          resolve({
            total: 2,
            next: null,
            items: [{ id: "item1" }, { id: "item2" }]
          });
        });
      });

    return expect(
      new SpotifyAPI("").getLibraryTracksJSON()
    ).resolves.toMatchObject([{ id: "item1" }, { id: "item2" }]);
  });

  it("should return combined chunks when SpotifyWebApi returns multiple chunks", () => {
    expect.assertions(1);
    jest
      .spyOn(SpotifyWebApi.prototype, "getMySavedTracks")
      .mockImplementationOnce(args => {
        if (args.limit !== 3 || args.offset !== 0) {
          return null;
        }

        return new Promise(function(resolve, reject) {
          resolve({
            total: 8,
            next: "next",
            items: [{ id: "item1" }, { id: "item2" }, { id: "item3" }]
          });
        });
      })
      .mockImplementationOnce(args => {
        if (args.limit !== 3 || args.offset !== 3) {
          return null;
        }

        return new Promise(function(resolve, reject) {
          resolve({
            total: 8,
            next: "next",
            items: [{ id: "item4" }, { id: "item5" }, { id: "item6" }]
          });
        });
      })
      .mockImplementationOnce(args => {
        if (args.limit !== 3 || args.offset !== 6) {
          return null;
        }

        return new Promise(function(resolve, reject) {
          resolve({
            total: 8,
            next: null,
            items: [{ id: "item7" }, { id: "item8" }]
          });
        });
      });

    return expect(
      new SpotifyAPI("").getLibraryTracksJSON(3)
    ).resolves.toMatchObject([
      { id: "item1" },
      { id: "item2" },
      { id: "item3" },
      { id: "item4" },
      { id: "item5" },
      { id: "item6" },
      { id: "item7" },
      { id: "item8" }
    ]);
  });
});
