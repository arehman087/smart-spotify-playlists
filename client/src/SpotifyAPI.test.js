import SpotifyAPI from "./SpotifyAPI";
import SpotifyWebApi from "spotify-web-api-js";

describe("constructor", () => {
  it("should construct SpotifyWebApi", () => {
    expect(new SpotifyAPI("mock_token").api.getAccessToken()).toBe(
      "mock_token"
    );
  });
});

describe("getLibraryTracksJSON", () => {
  it("should reject when initial error from SpotifyWebApi", async () => {
    expect.assertions(3);
    let spotifyWebApi = jest
      .spyOn(SpotifyWebApi.prototype, "getMySavedTracks")
      .mockClear()
      .mockImplementation(() => {
        return new Promise(function(resolve, reject) {
          reject("some error");
        });
      });

    await expect(
      new SpotifyAPI("").getLibraryTracksJSON(50)
    ).rejects.toMatchObject(
      new Error("failed to get first chunk of library tracks: some error")
    );

    expect(spotifyWebApi).toHaveBeenCalledTimes(1);
    expect(spotifyWebApi).toBeCalledWith({
      limit: 50,
      offset: 0
    });
  });

  it("should reject when subsequent error from SpotifyWebApi", async () => {
    expect.assertions(4);
    let spotifyWebApi = jest
      .spyOn(SpotifyWebApi.prototype, "getMySavedTracks")
      .mockClear()
      .mockImplementationOnce(() => {
        return new Promise(function(resolve, reject) {
          resolve({
            total: 4,
            next: "next",
            items: [{ id: "item1" }, { id: "item2" }]
          });
        });
      })
      .mockImplementationOnce(() => {
        return new Promise(function(resolve, reject) {
          reject("some error");
        });
      });

    await expect(
      new SpotifyAPI("").getLibraryTracksJSON(2)
    ).rejects.toMatchObject(
      new Error(
        "got first chunk of library tracks but failed to get subsequent: some error"
      )
    );

    expect(spotifyWebApi).toHaveBeenCalledTimes(2);
    expect(spotifyWebApi).toHaveBeenNthCalledWith(1, {
      limit: 2,
      offset: 0
    });
    expect(spotifyWebApi).toHaveBeenNthCalledWith(2, {
      limit: 2,
      offset: 2
    });
  });

  it("should resolve single chunk when SpotifyWebApi returns single chunk", async () => {
    expect.assertions(3);
    let spotifyWebApi = jest
      .spyOn(SpotifyWebApi.prototype, "getMySavedTracks")
      .mockClear()
      .mockImplementation(args => {
        return new Promise(function(resolve, reject) {
          resolve({
            total: 2,
            next: null,
            items: [{ id: "item1" }, { id: "item2" }]
          });
        });
      });

    await expect(
      new SpotifyAPI("").getLibraryTracksJSON(50)
    ).resolves.toMatchObject([{ id: "item1" }, { id: "item2" }]);

    expect(spotifyWebApi).toHaveBeenCalledTimes(1);
    expect(spotifyWebApi).toHaveBeenNthCalledWith(1, {
      limit: 50,
      offset: 0
    });
  });

  it("should resolve combined chunks when SpotifyWebApi returns multiple chunks", async () => {
    expect.assertions(5);
    let spotifyWebApi = jest
      .spyOn(SpotifyWebApi.prototype, "getMySavedTracks")
      .mockClear()
      .mockImplementationOnce(args => {
        return new Promise(function(resolve, reject) {
          resolve({
            total: 8,
            next: "next",
            items: [{ id: "item1" }, { id: "item2" }, { id: "item3" }]
          });
        });
      })
      .mockImplementationOnce(args => {
        return new Promise(function(resolve, reject) {
          resolve({
            total: 8,
            next: "next",
            items: [{ id: "item4" }, { id: "item5" }, { id: "item6" }]
          });
        });
      })
      .mockImplementationOnce(args => {
        return new Promise(function(resolve, reject) {
          resolve({
            total: 8,
            next: null,
            items: [{ id: "item7" }, { id: "item8" }]
          });
        });
      });

    await expect(
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

    expect(spotifyWebApi).toHaveBeenCalledTimes(3);
    expect(spotifyWebApi).toHaveBeenNthCalledWith(1, {
      limit: 3,
      offset: 0
    });
    expect(spotifyWebApi).toHaveBeenNthCalledWith(2, {
      limit: 3,
      offset: 3
    });
    expect(spotifyWebApi).toHaveBeenNthCalledWith(3, {
      limit: 3,
      offset: 6
    });
  });
});
