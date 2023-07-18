import { Test, TestingModule } from "@nestjs/testing";
import { DiskService } from "./disk.service";
import configuration from "config/configuration";
describe("DiskService", () => {
  let service: DiskService;
  const localKey = "external/activestorage_ex_rails/storage/";
  const railsStorageDirectory = "external/activestorage_ex_rails/storage/";

  beforeAll(() => {
    // TODO: pull from config service
  });

  beforeEach(async () => {
    service = configuration().activeStorage.service;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
  describe("download", () => {
    it("Returns a file from a given key as binary", () => {
      const downloadedFile = service.download(localKey);
      expect(downloadedFile).toBeDefined();
    });
    it("Returns an error if the file cannot be found", () => {
      const downloadedFile = service.download(localKey);
      expect(downloadedFile).toBeUndefined();
    });
  });
  describe("upload", () => {
    it("should be defined", () => {
      expect(service).toBeDefined();
    });
  });
  describe("delete", () => {
    it("should be defined", () => {
      expect(service).toBeDefined();
    });
  });
  describe("path_for", () => {
    it("should be defined", () => {
      expect(service).toBeDefined();
    });
  });
  describe("url", () => {
    it("should be defined", () => {
      expect(service).toBeDefined();
    });
  });
  describe("exists", () => {
    it("should be defined", () => {
      expect(service).toBeDefined();
    });
  });
});
