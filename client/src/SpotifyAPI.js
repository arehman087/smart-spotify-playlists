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
   * Returns the raw JSON data of all of the library tracks for the user.
   * @param {int} api_limit The maximum tracks per call (Spotify mandated).
   *     This value must be strictly between 1 and 50.
   * @returns {Promise<any>} A promise whose value is the array of all of the
   *     library tracks for the user.
   */
  getLibraryTracksJSON(api_limit = 50) {
    let tracks = [];
    return Promise.resolve()
      .then(() => {
        // Make an initial call to get the first chunk of tracks
        return this.api.getMySavedTracks({ limit: api_limit, offset: 0 });
      })
      .then(
        initial => {
          // Append the tracks from the initial chunk into the array
          tracks.push(...initial.items);

          // If there are no more chunks, return the tracks from it
          if (!initial.next) {
            return tracks;
          }

          // Create a promise for each chunk we need to request
          let offsets = [
            ...Array(Math.floor(initial.total / api_limit)).keys()
          ].map(index => (index + 1) * api_limit);
          let promises = offsets.map(offset => {
            return this.api.getMySavedTracks({
              limit: api_limit,
              offset: offset
            });
          });

          // Merge result of each promise into the tracks list and return it
          return Promise.all(promises).then(promises => {
            promises.forEach(promise => {
              tracks.push(...promise.items);
            });

            return tracks;
          });
        },
        reject => {
          console.error(`failed to get user library tracks: ${reject.message}`);
          return null;
        }
      );
  }
}

export default SpotifyAPI;
