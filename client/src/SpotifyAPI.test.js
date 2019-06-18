import SpotifyAPI from "./SpotifyAPI";
import SpotifyWebApi from "spotify-web-api-js";

var faker = require("faker");

describe("constructor", () => {
  it("should construct SpotifyWebApi", () => {
    expect(new SpotifyAPI("mock_token").api.getAccessToken()).toBe(
      "mock_token"
    );
  });
});

describe("getLibraryTracksJSON", () => {
  it("should merge", () => {
    const TEST_SIZE = 50;

    let tracks = new Array(TEST_SIZE).fill(null).map(
      e =>
        (e = {
          added_at: faker.date.past().toISOString(),
          track: {
            album: {
              album_type: faker.random.arrayElement([
                "album",
                "single",
                "compilation"
              ]),
              artists: new Array(faker.random.number({ min: 1, max: 3 }))
                .fill(null)
                .map(
                  e =>
                    (e = {
                      name: faker.name.firstName()
                    })
                ),
              name: faker.lorem.sentence(),
              release_date: faker.date.past().toISOString()
            },
            artists: new Array(faker.random.number({ min: 1, max: 3 }))
              .fill(null)
              .map(
                e =>
                  (e = {
                    name: faker.name.firstName()
                  })
              ),
            duration_ms: faker.random.number({ min: 120000, max: 240000 }),
            explicit: faker.random.boolean(),
            id: faker.random.alphaNumeric(20),
            name: faker.lorem.sentence(),
            track_number: faker.random.number({ min: 1, max: 20 }),
            disc_number: faker.random.number({ min: 1, max: 3 }),
            popularity: faker.random.number({ min: 0, max: 100 })
          }
        })
    );

    let features = new Array(TEST_SIZE).fill(null).map(
      e =>
        (e = {
          acousticness: Math.random(),
          danceability: Math.random(),
          energy: Math.random(),
          instrumentalness: Math.random(),
          key: faker.random.number({ min: 0, max: 11 }),
          liveness: Math.random(),
          loudness: faker.random.number({ min: -60, max: 0 }),
          mode: faker.random.number({ min: 0, max: 1 }),
          speechiness: Math.random(),
          tempo: faker.random.number({ min: 60, max: 180 }),
          time_signature: faker.random.number({ min: 1, max: 8 }),
          valence: Math.random()
        })
    );

    let mergedTracks = new SpotifyAPI("").mergeTracksWithFeatures(
      tracks,
      features
    );
    mergedTracks.forEach(function(mergedTrack, index) {
      let track = tracks[index];
      let trackFeatures = features[index];

      expect(mergedTrack.added_at).toBe(track.added_at);

      expect(mergedTrack.album.album_type).toBe(track.track.album.album_type);
      expect(mergedTrack.album.artists).toMatchObject(
        track.track.album.artists.map(artist => artist.name)
      );
      expect(mergedTrack.album.name).toBe(track.track.album.name);
      expect(mergedTrack.album.release_date).toBe(
        track.track.album.release_date
      );

      expect(mergedTrack.artists).toMatchObject(
        track.track.artists.map(artist => artist.name)
      );
      expect(mergedTrack.duration).toBe(track.track.duration_ms);
      expect(mergedTrack.explicit).toBe(track.track.explicit);
      expect(mergedTrack.id).toBe(track.track.id);
      expect(mergedTrack.name).toBe(track.track.name);
      expect(mergedTrack.track_number).toBe(track.track.track_number);
      expect(mergedTrack.disc_number).toBe(track.track.disc_number);

      expect(mergedTrack.features.popularity).toBe(track.track.popularity);
      expect(mergedTrack.features.acousticness).toBe(
        trackFeatures.acousticness
      );
      expect(mergedTrack.features.danceability).toBe(
        trackFeatures.danceability
      );
      expect(mergedTrack.features.energy).toBe(trackFeatures.energy);
      expect(mergedTrack.features.instrumentalness).toBe(
        trackFeatures.instrumentalness
      );
      expect(mergedTrack.features.key).toBe(trackFeatures.key);
      expect(mergedTrack.features.liveness).toBe(trackFeatures.liveness);
      expect(mergedTrack.features.loudness).toBe(trackFeatures.loudness);
      expect(mergedTrack.features.mode).toBe(trackFeatures.mode);
      expect(mergedTrack.features.speechiness).toBe(trackFeatures.speechiness);
      expect(mergedTrack.features.tempo).toBe(trackFeatures.tempo);
      expect(mergedTrack.features.time_signature).toBe(
        trackFeatures.time_signature
      );
      expect(mergedTrack.features.valence).toBe(trackFeatures.valence);
    });
  });
});

describe("getAudioFeaturesJSON", () => {
  it("should reject when error from SpotifyWebApi", async () => {
    expect.assertions(3);
    let spotifyWebApi = jest
      .spyOn(SpotifyWebApi.prototype, "getAudioFeaturesForTracks")
      .mockClear()
      .mockImplementation(() => {
        return new Promise(function(resolve, reject) {
          reject("some error");
        });
      });

    await expect(
      new SpotifyAPI("").getAudioFeaturesJSON(["track1", "track2"])
    ).rejects.toMatchObject(
      new Error("failed to get track audio features: some error")
    );

    expect(spotifyWebApi).toHaveBeenCalledTimes(1);
    expect(spotifyWebApi).toBeCalledWith(["track1", "track2"]);
  });

  it("should resolve when SpotifyWebApi resolves", async () => {
    expect.assertions(5);
    let spotifyWebApi = jest
      .spyOn(SpotifyWebApi.prototype, "getAudioFeaturesForTracks")
      .mockClear()
      .mockImplementationOnce(() => {
        return new Promise(function(resolve, reject) {
          resolve({
            audio_features: [
              { track_id: "track1", volume: 1, bass: 2 },
              { track_id: "track2", volume: 2, bass: 4 }
            ]
          });
        });
      })
      .mockImplementationOnce(() => {
        return new Promise(function(resolve, reject) {
          resolve({
            audio_features: [
              { track_id: "track3", volume: 3, bass: 8 },
              { track_id: "track4", volume: 4, bass: 16 }
            ]
          });
        });
      })
      .mockImplementationOnce(() => {
        return new Promise(function(resolve, reject) {
          resolve({
            audio_features: [{ track_id: "track5", volume: 5, bass: 32 }]
          });
        });
      });

    await expect(
      new SpotifyAPI("").getAudioFeaturesJSON(
        ["track1", "track2", "track3", "track4", "track5"],
        2
      )
    ).resolves.toMatchObject([
      { track_id: "track1", volume: 1, bass: 2 },
      { track_id: "track2", volume: 2, bass: 4 },
      { track_id: "track3", volume: 3, bass: 8 },
      { track_id: "track4", volume: 4, bass: 16 },
      { track_id: "track5", volume: 5, bass: 32 }
    ]);

    expect(spotifyWebApi).toHaveBeenCalledTimes(3);
    expect(spotifyWebApi).toBeCalledWith(["track1", "track2"]);
    expect(spotifyWebApi).toBeCalledWith(["track3", "track4"]);
    expect(spotifyWebApi).toBeCalledWith(["track5"]);
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
