const supertest = require("supertest");
const app = require("../../../app");
const insertFeed = require("../../../models/feed/insertFeed");
const fetchFeed = require("../../../api/rss/fetchFeed");
const mockDbResponse = require("../../../utils/for-tests/mock-db-response");
const mockFailResponse = require("../../../utils/for-tests/mock-fail-response");
const buildResponseFromSchema = require("../../../utils/for-tests/build-response-from-schema");

describe("/POST feeds test suite", () => {
  describe("/feeds", () => {
    it("Should return an error if rss_url is not sended", () => {
      return supertest(app)
        .post("/feeds")
        .expect(500)
        .then(({ body }) => {
          expect(body.message).toContain("validation error");
        });
    });

    it("Should return an error if rss_url is not an url", () => {
      const rss_url = "blob";

      return supertest(app)
        .post("/feeds")
        .send({ rss_url })
        .expect(500)
        .then(({ body }) => {
          expect(body.message).toContain("validation error");
        });
    });

    it("Should return an error if the rss url website do not provide xml", () => {
      const rss_url = "http://medium.com";

      fetchFeed.execute = mockFailResponse();

      return supertest(app)
        .post("/feeds")
        .send({ rss_url })
        .expect(500)
        .then(({ body }) => {
          expect(body.message).toContain("The rss url is not a rss feed");
        });
    });

    it("Should create and return the new feed", () => {
      const rss_url = "http://medium.com/feeds";
      const website_url = "http://medium.com";

      const insertFeedSchema = insertFeed.getSchema();

      const responseInsertFeed = buildResponseFromSchema(insertFeedSchema, {
        id: 1,
        name: "Medium",
        rss_url,
        website_url,
        is_default: false
      });

      insertFeed.execute = mockDbResponse(insertFeedSchema, responseInsertFeed);
      fetchFeed.execute = mockDbResponse(null, null);

      return supertest(app)
        .post("/feeds")
        .send({ rss_url })
        .expect(200)
        .then(({ body }) => {
          expect(body.rss_url).toEqual(rss_url);
        });
    });
  });
});
