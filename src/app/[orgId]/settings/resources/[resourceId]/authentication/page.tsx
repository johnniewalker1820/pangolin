"use client";

import { useEffect, useState } from "react";
import { ListRolesResponse } from "@server/routers/role";
import { toast } from "@app/hooks/useToast";
import { useOrgContext } from "@app/hooks/useOrgContext";
import { useResourceContext } from "@app/hooks/useResourceContext";
import { AxiosResponse } from "axios";
import { formatAxiosError } from "@app/lib/api";
import {
    GetResourceWhitelistResponse,
    ListResourceRolesResponse,
    ListResourceUsersResponse
} from "@server/routers/resource";
import { Button } from "@app/components/ui/button";
import { set, z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@app/components/ui/form";
import { ListUsersResponse } from "@server/routers/user";
import { Binary, Key } from "lucide-react";
import SetResourcePasswordForm from "./SetResourcePasswordForm";
import SetResourcePincodeForm from "./SetResourcePincodeForm";
import { createApiClient } from "@app/lib/api";
import { useEnvContext } from "@app/hooks/useEnvContext";
import {
    SettingsContainer,
    SettingsSection,
    SettingsSectionTitle,
    SettingsSectionHeader,
    SettingsSectionDescription,
    SettingsSectionBody,
    SettingsSectionFooter,
    SettingsSectionForm
} from "@app/components/Settings";
import { SwitchInput } from "@app/components/SwitchInput";
import { InfoPopup } from "@app/components/ui/info-popup";
import { Tag, TagInput } from "@app/components/tags/tag-input";
import { useRouter } from "next/navigation";
import { UserType } from "@server/types/UserTypes";
import { Alert, AlertDescription, AlertTitle } from "@app/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { Textarea } from "@app/components/ui/textarea";
import { Input } from "@app/components/ui/input";
import AuthPreview from "./AuthPreview";
import ImageUpload from "@app/components/ui/image-upload";
import AuthTemplates from "./AuthTemplates";

const UsersRolesFormSchema = z.object({
    roles: z.array(
        z.object({
            id: z.string(),
            text: z.string()
        })
    ),
    users: z.array(
        z.object({
            id: z.string(),
            text: z.string()
        })
    )
});

const whitelistSchema = z.object({
    emails: z.array(
        z.object({
            id: z.string(),
            text: z.string()
        })
    )
});

const authCustomizationSchema = z.object({
    authCustomCSS: z.string().optional(),
    authCustomHTML: z.string().optional(),
    authCustomLogo: z.string().optional(),
    authCustomTitle: z.string().optional(),
    authCustomDescription: z.string().optional(),
    authCustomBackground: z.string().optional(),
    authCustomEnabled: z.boolean()
});

export default function ResourceAuthenticationPage() {
    const { org } = useOrgContext();
    const { resource, updateResource, authInfo, updateAuthInfo } =
        useResourceContext();

    const { env } = useEnvContext();

    const api = createApiClient({ env });
    const router = useRouter();

    const [pageLoading, setPageLoading] = useState(true);

    const [allRoles, setAllRoles] = useState<{ id: string; text: string }[]>(
        []
    );
    const [allUsers, setAllUsers] = useState<{ id: string; text: string }[]>(
        []
    );
    const [activeRolesTagIndex, setActiveRolesTagIndex] = useState<
        number | null
    >(null);
    const [activeUsersTagIndex, setActiveUsersTagIndex] = useState<
        number | null
    >(null);

    const [activeEmailTagIndex, setActiveEmailTagIndex] = useState<
        number | null
    >(null);

    const [ssoEnabled, setSsoEnabled] = useState(resource.sso);
    // const [blockAccess, setBlockAccess] = useState(resource.blockAccess);
    const [whitelistEnabled, setWhitelistEnabled] = useState(
        resource.emailWhitelistEnabled
    );

    const [loadingSaveUsersRoles, setLoadingSaveUsersRoles] = useState(false);
    const [loadingSaveWhitelist, setLoadingSaveWhitelist] = useState(false);

    const [loadingRemoveResourcePassword, setLoadingRemoveResourcePassword] =
        useState(false);
    const [loadingRemoveResourcePincode, setLoadingRemoveResourcePincode] =
        useState(false);

    const [isSetPasswordOpen, setIsSetPasswordOpen] = useState(false);
    const [isSetPincodeOpen, setIsSetPincodeOpen] = useState(false);

    // Auth customization states
    const [loadingSaveAuthCustomization, setLoadingSaveAuthCustomization] = useState(false);
    const [loadingAuthCustomization, setLoadingAuthCustomization] = useState(true);

    const usersRolesForm = useForm<z.infer<typeof UsersRolesFormSchema>>({
        resolver: zodResolver(UsersRolesFormSchema),
        defaultValues: { roles: [], users: [] }
    });

    const whitelistForm = useForm<z.infer<typeof whitelistSchema>>({
        resolver: zodResolver(whitelistSchema),
        defaultValues: { emails: [] }
    });

    const authCustomizationForm = useForm<z.infer<typeof authCustomizationSchema>>({
        resolver: zodResolver(authCustomizationSchema),
        defaultValues: {
            authCustomCSS: "",
            authCustomHTML: "",
            authCustomLogo: "",
            authCustomTitle: "",
            authCustomDescription: "",
            authCustomBackground: "",
            authCustomEnabled: false
        }
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [
                    rolesResponse,
                    resourceRolesResponse,
                    usersResponse,
                    resourceUsersResponse,
                    whitelist,
                    authCustomizationResponse
                ] = await Promise.all([
                    api.get<AxiosResponse<ListRolesResponse>>(
                        `/org/${org?.org.orgId}/roles`
                    ),
                    api.get<AxiosResponse<ListResourceRolesResponse>>(
                        `/resource/${resource.resourceId}/roles`
                    ),
                    api.get<AxiosResponse<ListUsersResponse>>(
                        `/org/${org?.org.orgId}/users`
                    ),
                    api.get<AxiosResponse<ListResourceUsersResponse>>(
                        `/resource/${resource.resourceId}/users`
                    ),
                    api.get<AxiosResponse<GetResourceWhitelistResponse>>(
                        `/resource/${resource.resourceId}/whitelist`
                    ),
                    api.get(
                        `/resource/${resource.resourceId}/auth-customization`
                    )
                ]);

                setAllRoles(
                    rolesResponse.data.data.roles
                        .map((role) => ({
                            id: role.roleId.toString(),
                            text: role.name
                        }))
                        .filter((role) => role.text !== "Admin")
                );

                usersRolesForm.setValue(
                    "roles",
                    resourceRolesResponse.data.data.roles
                        .map((i) => ({
                            id: i.roleId.toString(),
                            text: i.name
                        }))
                        .filter((role) => role.text !== "Admin")
                );

                setAllUsers(
                    usersResponse.data.data.users.map((user) => ({
                        id: user.id.toString(),
                        text: `${user.email || user.username}${user.type !== UserType.Internal ? ` (${user.idpName})` : ""}`
                    }))
                );

                usersRolesForm.setValue(
                    "users",
                    resourceUsersResponse.data.data.users.map((i) => ({
                        id: i.userId.toString(),
                        text: `${i.email || i.username}${i.type !== UserType.Internal ? ` (${i.idpName})` : ""}`
                    }))
                );

                whitelistForm.setValue(
                    "emails",
                    whitelist.data.data.whitelist.map((w) => ({
                        id: w.email,
                        text: w.email
                    }))
                );

                // Load auth customization data
                if (authCustomizationResponse.data.success) {
                    authCustomizationForm.reset(authCustomizationResponse.data.data);
                }

                setPageLoading(false);
                setLoadingAuthCustomization(false);
            } catch (e) {
                console.error(e);
                toast({
                    variant: "destructive",
                    title: "Failed to fetch data",
                    description: formatAxiosError(
                        e,
                        "An error occurred while fetching the data"
                    )
                });
            }
        };

        fetchData();
    }, []);

    async function saveWhitelist() {
        setLoadingSaveWhitelist(true);
        try {
            await api.post(`/resource/${resource.resourceId}`, {
                emailWhitelistEnabled: whitelistEnabled
            });

            if (whitelistEnabled) {
                await api.post(`/resource/${resource.resourceId}/whitelist`, {
                    emails: whitelistForm.getValues().emails.map((i) => i.text)
                });
            }

            updateResource({
                emailWhitelistEnabled: whitelistEnabled
            });

            toast({
                title: "Saved successfully",
                description: "Whitelist settings have been saved"
            });
            router.refresh();
        } catch (e) {
            console.error(e);
            toast({
                variant: "destructive",
                title: "Failed to save whitelist",
                description: formatAxiosError(
                    e,
                    "An error occurred while saving the whitelist"
                )
            });
        } finally {
            setLoadingSaveWhitelist(false);
        }
    }

    async function saveAuthCustomization(data: z.infer<typeof authCustomizationSchema>) {
        setLoadingSaveAuthCustomization(true);
        try {
            await api.post(`/resource/${resource.resourceId}/auth-customization`, data);

            toast({
                title: "Saved successfully",
                description: "Auth customization settings have been saved"
            });
            router.refresh();
        } catch (e) {
            console.error(e);
            toast({
                variant: "destructive",
                title: "Failed to save customization",
                description: formatAxiosError(
                    e,
                    "An error occurred while saving the auth customization"
                )
            });
        } finally {
            setLoadingSaveAuthCustomization(false);
        }
    }

    const applyTemplate = (templateData: any) => {
        authCustomizationForm.reset(templateData);
        toast({
            title: "Template applied",
            description: "The template has been applied. Don't forget to save your changes."
        });
    };

    async function onSubmitUsersRoles(
        data: z.infer<typeof UsersRolesFormSchema>
    ) {
        try {
            setLoadingSaveUsersRoles(true);

            const jobs = [
                api.post(`/resource/${resource.resourceId}/roles`, {
                    roleIds: data.roles.map((i) => parseInt(i.id))
                }),
                api.post(`/resource/${resource.resourceId}/users`, {
                    userIds: data.users.map((i) => i.id)
                }),
                api.post(`/resource/${resource.resourceId}`, {
                    sso: ssoEnabled
                })
            ];

            await Promise.all(jobs);

            updateResource({
                sso: ssoEnabled
            });

            updateAuthInfo({
                sso: ssoEnabled
            });

            toast({
                title: "Saved successfully",
                description: "Authentication settings have been saved"
            });
            router.refresh();
        } catch (e) {
            console.error(e);
            toast({
                variant: "destructive",
                title: "Failed to set roles",
                description: formatAxiosError(
                    e,
                    "An error occurred while setting the roles"
                )
            });
        } finally {
            setLoadingSaveUsersRoles(false);
        }
    }

    function removeResourcePassword() {
        setLoadingRemoveResourcePassword(true);

        api.post(`/resource/${resource.resourceId}/password`, {
            password: null
        })
            .then(() => {
                toast({
                    title: "Resource password removed",
                    description:
                        "The resource password has been removed successfully"
                });

                updateAuthInfo({
                    password: false
                });
                router.refresh();
            })
            .catch((e) => {
                toast({
                    variant: "destructive",
                    title: "Error removing resource password",
                    description: formatAxiosError(
                        e,
                        "An error occurred while removing the resource password"
                    )
                });
            })
            .finally(() => setLoadingRemoveResourcePassword(false));
    }

    function removeResourcePincode() {
        setLoadingRemoveResourcePincode(true);

        api.post(`/resource/${resource.resourceId}/pincode`, {
            pincode: null
        })
            .then(() => {
                toast({
                    title: "Resource pincode removed",
                    description:
                        "The resource password has been removed successfully"
                });

                updateAuthInfo({
                    pincode: false
                });
                router.refresh();
            })
            .catch((e) => {
                toast({
                    variant: "destructive",
                    title: "Error removing resource pincode",
                    description: formatAxiosError(
                        e,
                        "An error occurred while removing the resource pincode"
                    )
                });
            })
            .finally(() => setLoadingRemoveResourcePincode(false));
    }

    if (pageLoading) {
        return <></>;
    }

    return (
        <>
            {isSetPasswordOpen && (
                <SetResourcePasswordForm
                    open={isSetPasswordOpen}
                    setOpen={setIsSetPasswordOpen}
                    resourceId={resource.resourceId}
                    onSetPassword={() => {
                        setIsSetPasswordOpen(false);
                        updateAuthInfo({
                            password: true
                        });
                    }}
                />
            )}

            {isSetPincodeOpen && (
                <SetResourcePincodeForm
                    open={isSetPincodeOpen}
                    setOpen={setIsSetPincodeOpen}
                    resourceId={resource.resourceId}
                    onSetPincode={() => {
                        setIsSetPincodeOpen(false);
                        updateAuthInfo({
                            pincode: true
                        });
                    }}
                />
            )}

            <SettingsContainer>
                <SettingsSection>
                    <SettingsSectionHeader>
                        <SettingsSectionTitle>
                            Users & Roles
                        </SettingsSectionTitle>
                        <SettingsSectionDescription>
                            Configure which users and roles can visit this
                            resource
                        </SettingsSectionDescription>
                    </SettingsSectionHeader>
                    <SettingsSectionBody>
                        <SwitchInput
                            id="sso-toggle"
                            label="Use Platform SSO"
                            description="Existing users will only have to log in once for all resources that have this enabled."
                            defaultChecked={resource.sso}
                            onCheckedChange={(val) => setSsoEnabled(val)}
                        />

                        <Form {...usersRolesForm}>
                            <form
                                onSubmit={usersRolesForm.handleSubmit(
                                    onSubmitUsersRoles
                                )}
                                id="users-roles-form"
                                className="space-y-4"
                            >
                                {ssoEnabled && (
                                    <>
                                        <FormField
                                            control={usersRolesForm.control}
                                            name="roles"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col items-start">
                                                    <FormLabel>Roles</FormLabel>
                                                    <FormControl>
                                                        <TagInput
                                                            {...field}
                                                            activeTagIndex={
                                                                activeRolesTagIndex
                                                            }
                                                            setActiveTagIndex={
                                                                setActiveRolesTagIndex
                                                            }
                                                            placeholder="Select a role"
                                                            size="sm"
                                                            tags={
                                                                usersRolesForm.getValues()
                                                                    .roles
                                                            }
                                                            setTags={(
                                                                newRoles
                                                            ) => {
                                                                usersRolesForm.setValue(
                                                                    "roles",
                                                                    newRoles as [
                                                                        Tag,
                                                                        ...Tag[]
                                                                    ]
                                                                );
                                                            }}
                                                            enableAutocomplete={
                                                                true
                                                            }
                                                            autocompleteOptions={
                                                                allRoles
                                                            }
                                                            allowDuplicates={
                                                                false
                                                            }
                                                            restrictTagsToAutocompleteOptions={
                                                                true
                                                            }
                                                            sortTags={true}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                    <FormDescription>
                                                        Admins can always access
                                                        this resource.
                                                    </FormDescription>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={usersRolesForm.control}
                                            name="users"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col items-start">
                                                    <FormLabel>Users</FormLabel>
                                                    <FormControl>
                                                        <TagInput
                                                            {...field}
                                                            activeTagIndex={
                                                                activeUsersTagIndex
                                                            }
                                                            setActiveTagIndex={
                                                                setActiveUsersTagIndex
                                                            }
                                                            placeholder="Select a user"
                                                            tags={
                                                                usersRolesForm.getValues()
                                                                    .users
                                                            }
                                                            size="sm"
                                                            setTags={(
                                                                newUsers
                                                            ) => {
                                                                usersRolesForm.setValue(
                                                                    "users",
                                                                    newUsers as [
                                                                        Tag,
                                                                        ...Tag[]
                                                                    ]
                                                                );
                                                            }}
                                                            enableAutocomplete={
                                                                true
                                                            }
                                                            autocompleteOptions={
                                                                allUsers
                                                            }
                                                            allowDuplicates={
                                                                false
                                                            }
                                                            restrictTagsToAutocompleteOptions={
                                                                true
                                                            }
                                                            sortTags={true}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                )}
                            </form>
                        </Form>
                    </SettingsSectionBody>
                    <SettingsSectionFooter>
                        <Button
                            type="submit"
                            loading={loadingSaveUsersRoles}
                            disabled={loadingSaveUsersRoles}
                            form="users-roles-form"
                        >
                            Save Users & Roles
                        </Button>
                    </SettingsSectionFooter>
                </SettingsSection>

                <SettingsSection>
                    <SettingsSectionHeader>
                        <SettingsSectionTitle>
                            Authentication Methods
                        </SettingsSectionTitle>
                        <SettingsSectionDescription>
                            Allow access to the resource via additional auth
                            methods
                        </SettingsSectionDescription>
                    </SettingsSectionHeader>
                    <SettingsSectionBody>
                        {/* Password Protection */}
                        <div className="flex items-center justify-between">
                            <div
                                className={`flex items-center text-${!authInfo.password ? "neutral" : "green"}-500 space-x-2`}
                            >
                                <Key />
                                <span>
                                    Password Protection{" "}
                                    {authInfo.password ? "Enabled" : "Disabled"}
                                </span>
                            </div>
                            <Button
                                variant="outlinePrimary"
                                onClick={
                                    authInfo.password
                                        ? removeResourcePassword
                                        : () => setIsSetPasswordOpen(true)
                                }
                                loading={loadingRemoveResourcePassword}
                            >
                                {authInfo.password
                                    ? "Remove Password"
                                    : "Add Password"}
                            </Button>
                        </div>

                        {/* PIN Code Protection */}
                        <div className="flex items-center justify-between">
                            <div
                                className={`flex items-center text-${!authInfo.pincode ? "neutral" : "green"}-500 space-x-2`}
                            >
                                <Binary />
                                <span>
                                    PIN Code Protection{" "}
                                    {authInfo.pincode ? "Enabled" : "Disabled"}
                                </span>
                            </div>
                            <Button
                                variant="outlinePrimary"
                                onClick={
                                    authInfo.pincode
                                        ? removeResourcePincode
                                        : () => setIsSetPincodeOpen(true)
                                }
                                loading={loadingRemoveResourcePincode}
                            >
                                {authInfo.pincode
                                    ? "Remove PIN Code"
                                    : "Add PIN Code"}
                            </Button>
                        </div>
                    </SettingsSectionBody>
                </SettingsSection>

                <SettingsSection>
                    <SettingsSectionHeader>
                        <SettingsSectionTitle>
                            One-time Passwords
                        </SettingsSectionTitle>
                        <SettingsSectionDescription>
                            Require email-based authentication for resource
                            access
                        </SettingsSectionDescription>
                    </SettingsSectionHeader>
                    <SettingsSectionBody>
                        {!env.email.emailEnabled && (
                            <Alert variant="neutral" className="mb-4">
                                <InfoIcon className="h-4 w-4" />
                                <AlertTitle className="font-semibold">
                                    SMTP Required
                                </AlertTitle>
                                <AlertDescription>
                                    SMTP must be enabled on the server to use one-time password authentication.
                                </AlertDescription>
                            </Alert>
                        )}
                        <SwitchInput
                            id="whitelist-toggle"
                            label="Email Whitelist"
                            defaultChecked={resource.emailWhitelistEnabled}
                            onCheckedChange={setWhitelistEnabled}
                            disabled={!env.email.emailEnabled}
                        />

                        {whitelistEnabled && env.email.emailEnabled && (
                            <Form {...whitelistForm}>
                                <form id="whitelist-form">
                                    <FormField
                                        control={whitelistForm.control}
                                        name="emails"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    <InfoPopup
                                                        text="Whitelisted Emails"
                                                        info="Only users with these email addresses will be able to access this resource. They will be prompted to enter a one-time password sent to their email. Wildcards (*@example.com) can be used to allow any email address from a domain."
                                                    />
                                                </FormLabel>
                                                <FormControl>
                                                    {/* @ts-ignore */}
                                                    <TagInput
                                                        {...field}
                                                        activeTagIndex={
                                                            activeEmailTagIndex
                                                        }
                                                        size={"sm"}
                                                        validateTag={(
                                                            tag
                                                        ) => {
                                                            return z
                                                                .string()
                                                                .email()
                                                                .or(
                                                                    z
                                                                        .string()
                                                                        .regex(
                                                                            /^\*@[\w.-]+\.[a-zA-Z]{2,}$/,
                                                                            {
                                                                                message:
                                                                                    "Invalid email address. Wildcard (*) must be the entire local part."
                                                                            }
                                                                        )
                                                                )
                                                                .safeParse(
                                                                    tag
                                                                ).success;
                                                        }}
                                                        setActiveTagIndex={
                                                            setActiveEmailTagIndex
                                                        }
                                                        placeholder="Enter an email"
                                                        tags={
                                                            whitelistForm.getValues()
                                                                .emails
                                                        }
                                                        setTags={(
                                                            newRoles
                                                        ) => {
                                                            whitelistForm.setValue(
                                                                "emails",
                                                                newRoles as [
                                                                    Tag,
                                                                    ...Tag[]
                                                                ]
                                                            );
                                                        }}
                                                        allowDuplicates={
                                                            false
                                                        }
                                                        sortTags={true}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    Press enter to add an
                                                    email after typing it in
                                                    the input field.
                                                </FormDescription>
                                            </FormItem>
                                        )}
                                    />
                                </form>
                            </Form>
                        )}
                    </SettingsSectionBody>
                    <SettingsSectionFooter>
                        <Button
                            onClick={saveWhitelist}
                            form="whitelist-form"
                            loading={loadingSaveWhitelist}
                            disabled={loadingSaveWhitelist}
                        >
                            Save Whitelist
                        </Button>
                    </SettingsSectionFooter>
                </SettingsSection>

                <SettingsSection>
                    <SettingsSectionHeader>
                        <SettingsSectionTitle>
                            Authentication Page Customization
                        </SettingsSectionTitle>
                        <SettingsSectionDescription>
                            Customize the appearance and content of your authentication page with HTML, CSS, and images
                        </SettingsSectionDescription>
                    </SettingsSectionHeader>
                    <SettingsSectionBody>
                        <AuthTemplates onApplyTemplate={applyTemplate} />
                        
                        <Form {...authCustomizationForm}>
                            <form
                                onSubmit={authCustomizationForm.handleSubmit(saveAuthCustomization)}
                                id="auth-customization-form"
                                className="space-y-4"
                            >
                                <SwitchInput
                                    id="auth-custom-enabled"
                                    label="Enable Custom Authentication Page"
                                    description="Enable custom styling and content for your authentication page"
                                    defaultChecked={authCustomizationForm.getValues().authCustomEnabled}
                                    onCheckedChange={(val) => authCustomizationForm.setValue("authCustomEnabled", val)}
                                />

                                {authCustomizationForm.watch("authCustomEnabled") && (
                                    <>
                                        <FormField
                                            control={authCustomizationForm.control}
                                            name="authCustomTitle"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Custom Title</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Enter custom page title"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Override the default authentication page title
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={authCustomizationForm.control}
                                            name="authCustomDescription"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Custom Description</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Enter custom description"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Custom description text shown on the authentication page
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={authCustomizationForm.control}
                                            name="authCustomCSS"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Custom CSS</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Enter custom CSS styles"
                                                            className="font-mono"
                                                            rows={6}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Custom CSS styles to apply to the authentication page
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={authCustomizationForm.control}
                                            name="authCustomHTML"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Custom HTML</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Enter custom HTML content"
                                                            className="font-mono"
                                                            rows={4}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Custom HTML content to add to the authentication page
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={authCustomizationForm.control}
                                            name="authCustomLogo"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Custom Logo</FormLabel>
                                                    <FormControl>
                                                        <ImageUpload
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            placeholder="Enter logo URL or upload an image file"
                                                            accept="image/*"
                                                            maxSize={2}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Upload an image file or enter a URL for a custom logo
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={authCustomizationForm.control}
                                            name="authCustomBackground"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Custom Background</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder="Enter CSS background property"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        CSS background property (e.g., linear-gradient(45deg, #ff0000, #0000ff))
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                )}
                            </form>
                        </Form>
                    </SettingsSectionBody>
                    <SettingsSectionFooter>
                        <div className="flex items-center justify-between w-full">
                            <AuthPreview customization={authCustomizationForm.getValues()} />
                            <Button
                                type="submit"
                                form="auth-customization-form"
                                loading={loadingSaveAuthCustomization}
                                disabled={loadingSaveAuthCustomization || loadingAuthCustomization}
                            >
                                Save Customization
                            </Button>
                        </div>
                    </SettingsSectionFooter>
                </SettingsSection>
            </SettingsContainer>
        </>
    );
}
