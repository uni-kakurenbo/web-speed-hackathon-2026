import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Router } from "express";
import httpErrors from "http-errors";
import { v4 as uuidv4 } from "uuid";

import { runFfmpeg } from "@web-speed-hackathon-2026/server/src/utils/ffmpeg";
import { uploadFileToS3 } from "@web-speed-hackathon-2026/server/src/utils/s3";

// 変換した画像の拡張子
const EXTENSION = "avif";

export const imageRouter = Router();

imageRouter.post("/images", async (req, res) => {
    if (req.session.userId === undefined) {
        throw new httpErrors.Unauthorized();
    }
    if (Buffer.isBuffer(req.body) === false) {
        throw new httpErrors.BadRequest();
    }

    const imageId = uuidv4();
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "image-upload-"));

    let output: Buffer;

    try {
        const inputPath = path.join(tempDir, "input");
        const outputPath = path.join(tempDir, `output.${EXTENSION}`);

        await fs.writeFile(inputPath, req.body);
        await runFfmpeg([
            "-y",
            "-i",
            inputPath,
            "-frames:v",
            "1",
            "-vf",
            "scale='min(iw,600)':-1",
            "-c:v",
            "libaom-av1",
            "-still-picture",
            "1",
            "-b:v",
            "0",
            outputPath,
        ]);

        output = await fs.readFile(outputPath);
    } catch {
        throw new httpErrors.BadRequest("Invalid file type");
    } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
    }

    await uploadFileToS3(
        `images/${imageId}.${EXTENSION}`,
        output,
        "image/avif",
    );

    return res.status(200).type("application/json").send({ id: imageId });
});
