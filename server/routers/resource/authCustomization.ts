import db from "@server/db";
import { Request, Response, NextFunction } from "express";
import { resources } from "@server/db/schemas";
import { eq } from "drizzle-orm";
import { z } from "zod";

const AuthCustomizationSchema = z.object({
    authCustomCSS: z.string().optional().refine(
        (css) => !css || !css.includes('<script'), 
        { message: "CSS cannot contain script tags" }
    ),
    authCustomHTML: z.string().optional().refine(
        (html) => !html || (!html.includes('<script') && !html.includes('javascript:')), 
        { message: "HTML cannot contain script tags or javascript: URLs" }
    ),
    authCustomLogo: z.string().optional().refine(
        (logo) => !logo || logo.startsWith('data:image/') || logo.startsWith('http://') || logo.startsWith('https://'), 
        { message: "Logo must be a valid image URL or data URL" }
    ),
    authCustomTitle: z.string().max(100, "Title too long").optional(),
    authCustomDescription: z.string().max(500, "Description too long").optional(),
    authCustomBackground: z.string().max(200, "Background CSS too long").optional(),
    authCustomEnabled: z.boolean()
});

const AuthCustomizationParamsSchema = z.object({
    resourceId: z.coerce.number()
});

type AuthCustomizationRequest = z.infer<typeof AuthCustomizationSchema>;
type AuthCustomizationParams = z.infer<typeof AuthCustomizationParamsSchema>;

// GET /resource/:resourceId/auth-customization
export async function getResourceAuthCustomization(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { resourceId } = AuthCustomizationParamsSchema.parse(req.params);

        const resource = await db
            .select({
                authCustomCSS: resources.authCustomCSS,
                authCustomHTML: resources.authCustomHTML,
                authCustomLogo: resources.authCustomLogo,
                authCustomTitle: resources.authCustomTitle,
                authCustomDescription: resources.authCustomDescription,
                authCustomBackground: resources.authCustomBackground,
                authCustomEnabled: resources.authCustomEnabled
            })
            .from(resources)
            .where(eq(resources.resourceId, resourceId))
            .limit(1);

        if (!resource || resource.length === 0) {
            res.status(404).json({
                success: false,
                error: "Resource not found"
            });
            return;
        }

        const authCustomization = {
            authCustomCSS: resource[0].authCustomCSS || "",
            authCustomHTML: resource[0].authCustomHTML || "",
            authCustomLogo: resource[0].authCustomLogo || "",
            authCustomTitle: resource[0].authCustomTitle || "",
            authCustomDescription: resource[0].authCustomDescription || "",
            authCustomBackground: resource[0].authCustomBackground || "",
            authCustomEnabled: Boolean(resource[0].authCustomEnabled)
        };

        res.json({
            success: true,
            data: authCustomization
        });
    } catch (error) {
        console.error("Error getting auth customization:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
}

// POST /resource/:resourceId/auth-customization
export async function setResourceAuthCustomization(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const { resourceId } = AuthCustomizationParamsSchema.parse(req.params);
        const authCustomData = AuthCustomizationSchema.parse(req.body);

        // Update the resource with auth customization data
        await db
            .update(resources)
            .set({
                authCustomCSS: authCustomData.authCustomCSS || null,
                authCustomHTML: authCustomData.authCustomHTML || null,
                authCustomLogo: authCustomData.authCustomLogo || null,
                authCustomTitle: authCustomData.authCustomTitle || null,
                authCustomDescription: authCustomData.authCustomDescription || null,
                authCustomBackground: authCustomData.authCustomBackground || null,
                authCustomEnabled: authCustomData.authCustomEnabled
            })
            .where(eq(resources.resourceId, resourceId));

        res.json({
            success: true,
            message: "Auth customization updated successfully"
        });
    } catch (error) {
        console.error("Error setting auth customization:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
}

export {
    AuthCustomizationSchema,
    AuthCustomizationParamsSchema,
    type AuthCustomizationRequest,
    type AuthCustomizationParams
};
