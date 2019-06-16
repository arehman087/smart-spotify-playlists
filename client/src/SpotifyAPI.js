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
          return Promise.all(promises).then(
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
