import SpotifyWebApi from "spotify-web-api-js";

/**
 * Class containing helper methods for the Spotify API.
 */
class SpotifyAPI {
  /**
   * Instantiates the SpotifyWebApi instance using the specified authorization
   * token.
   * @param {str} authToken The authorization token.
   */
  constructor(token) {
    this.api = new SpotifyWebApi();
    this.api.setAccessToken(token);
  }

  /**
   * Merges the specified list of tracks with the (relevant) audio features of
   * each track to return the JSON representation below for each track. Each
   * track at `tracks[i]` is matched to the audio features at `features[i]`.
   * 
   * The JSON representation of each track has the following structure:
     ```
     {
       added_at: "time at which the track was added to the library",
       album: {
         album_type: "one of { album, single, compilation }",
         artists: "list of artist names who worked on the album",
         name: "the album name",
         release_date: "the date (exact, month/year, year) of release"
       },
       artists: "list of artist names who worked on the track",
       duration: "song duration in milliseconds",
       explicit: "true if the song is explicit; false otherwise",
       id: "the internal Spotify ID of the song",
       name: "the track name",
       track_number: "the track listing in the album",
       disc_number: "the disc listing in the album",
       features: {
         popularity: "track popularity on Spotify [0, 100]",
         acousticness: "confidence in acousticness [0.0, 1.0]",
         danceability: "suitability for dancing [0.0, 1.0]",
         energy: "energy measure [0.0, 1.0]",
         instrumentalness: "measure of lack of vocals [0.0, 1.0]",
         key: "pitch class of the track [0=C, 11=B]",
         liveness: "audience presence [0.0, 1.0]",
         loudness: "overall track loudness [-60dB, 0dB]",
         mode: "track modality [0=minor, 1=major]",
         speechiness: "presence of speech [0.0, 1.0]",
         tempo: "track beats per minute",
         time_signature: "estimated beats per bar",
         valence: "track musical positivity [0.0, 1.0]"
       }
     }
     ```
   *
   * @param {Object[]} tracks The list of track objects, in their original JSON
   *     representation as returned by the Spotify API.
   * @param {Object[]} features The list of audio features, in the original
   *     JSON representation as returned by the Spotify API.
   * @returns The array of JSON representations of each track.
   */
  mergeTracksWithFeatures(tracks, features) {
    return tracks.map((trackJSON, index) => {
      let featureJSON = features[index];

      return {
        added_at: trackJSON.added_at,
        album: {
          album_type: trackJSON.track.album.album_type,
          artists: trackJSON.track.album.artists.map(artist => artist.name),
          name: trackJSON.track.album.name,
          release_date: trackJSON.track.album.release_date
        },
        artists: trackJSON.track.artists.map(artist => artist.name),
        duration: trackJSON.track.duration_ms,
        explicit: trackJSON.track.explicit,
        id: trackJSON.track.id,
        name: trackJSON.track.name,
        track_number: trackJSON.track.track_number,
        disc_number: trackJSON.track.disc_number,

        features: {
          popularity: trackJSON.track.popularity,
          acousticness: featureJSON.acousticness,
          danceability: featureJSON.danceability,
          energy: featureJSON.energy,
          instrumentalness: featureJSON.instrumentalness,
          key: featureJSON.key,
          liveness: featureJSON.liveness,
          loudness: featureJSON.loudness,
          mode: featureJSON.mode,
          speechiness: featureJSON.speechiness,
          tempo: featureJSON.tempo,
          time_signature: featureJSON.time_signature,
          valence: featureJSON.valence
        }
      };
    });
  }

  /**
   * Gets the raw JSON data of the audio features of the specified list of
   * tracks.
   * @param {string[]} tracks The list of track IDs.
   * @param {int} api_limit The maximum tracks per call (Spotify mandated).
   * @returns {Promise<any>} A promise which resolves to the array of all of
   *     the audio features of the specified tracks, or rejects to the error
   *     which occured. The array of audio features is the same length as the
   *     `tracks` parameter, and is in the same order.
   */
  getAudioFeaturesJSON(tracks, api_limit = 100) {
    return new Promise((resolve, reject) => {
      // Split the tracks into API limit sized chunks
      let tracksGroups = [];
      while (tracks.length) {
        let tracksGroup = tracks.splice(0, api_limit);
        tracksGroups.push(tracksGroup);
      }

      // Create a promise for each group of tracks
      let promises = tracksGroups.map(tracksGroup => {
        return this.api.getAudioFeaturesForTracks(tracksGroup);
      });

      // Merge result of each promise into the tracks list and return it
      let audioFeatures = [];
      Promise.all(promises).then(
        resolved => {
          resolved.forEach(promise => {
            audioFeatures.push(...promise.audio_features);
          });

          resolve(audioFeatures);
        },
        rejected => {
          reject(new Error(`failed to get track audio features: ${rejected}`));
        }
      );
    });
  }

  /**
   * Gets the raw JSON data of all of the library tracks for the user.
   * @param {int} api_limit The maximum tracks per call (Spotify mandated).
   * @returns {Promise<any>} A promise which resolves to the array of all of
   *     the library tracks for the user, or rejects to the error which
   *     occured.
   */
  getLibraryTracksJSON(api_limit = 50) {
    return new Promise((resolve, reject) => {
      // Make an initial call to get the first chunk of tracks
      let initialPromise = this.api.getMySavedTracks({
        limit: api_limit,
        offset: 0
      });

      let tracks = [];
      initialPromise.then(
        resolved => {
          // Append the tracks from the initial chunk into the array
          tracks.push(...resolved.items);

          // If there are no more chunks, return the tracks from it
          if (!resolved.next) {
            resolve(tracks);
          }

          // Create a promise for each subsequent chunk we need to request
          let offsets = [
            ...Array(Math.floor((resolved.total - 1) / api_limit)).keys()
          ].map(index => (index + 1) * api_limit);
          let promises = offsets.map(offset => {
            return this.api.getMySavedTracks({
              limit: api_limit,
              offset: offset
            });
          });

          // Merge result of each promise into the tracks list and return it
          Promise.all(promises).then(
            resolved => {
              resolved.forEach(promise => {
                tracks.push(...promise.items);
              });

              resolve(tracks);
            },
            rejected => {
              reject(
                new Error(
                  `got first chunk of library tracks ` +
                    `but failed to get subsequent: ${rejected}`
                )
              );
            }
          );
        },
        rejected => {
          reject(
            new Error(
              `failed to get first chunk of library tracks: ${rejected}`
            )
          );
        }
      );
    });
  }
}

export default SpotifyAPI;
