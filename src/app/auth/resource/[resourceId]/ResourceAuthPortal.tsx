"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form";
import { LockIcon, Binary, Key, User, Send, AtSign, Shield, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot
} from "@app/components/ui/input-otp";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@app/components/ui/alert";
import { formatAxiosError } from "@app/lib/api";
import { AxiosResponse } from "axios";
import LoginForm, { LoginFormIDP } from "@app/components/LoginForm";
import {
    AuthWithPasswordResponse,
    AuthWithWhitelistResponse
} from "@server/routers/resource";
import ResourceAccessDenied from "./ResourceAccessDenied";
import { createApiClient } from "@app/lib/api";
import { useEnvContext } from "@app/hooks/useEnvContext";
import { toast } from "@app/hooks/useToast";
import Link from "next/link";
import { useSupporterStatusContext } from "@app/hooks/useSupporterStatusContext";
// Import enhanced styles
import "../../resource-auth-styles.css";
// Import new components
import SecurityStatus from "../components/SecurityStatus";

const pinSchema = z.object({
    pin: z
        .string()
        .length(6, { message: "PIN must be exactly 6 digits" })
        .regex(/^\d+$/, { message: "PIN must only contain numbers" })
});

const passwordSchema = z.object({
    password: z.string().min(1, {
        message: "Password must be at least 1 character long"
    })
});

const requestOtpSchema = z.object({
    email: z.string().email()
});

const submitOtpSchema = z.object({
    email: z.string().email(),
    otp: z.string().min(1, {
        message: "OTP must be at least 1 character long"
    })
});

type ResourceAuthPortalProps = {
    methods: {
        password: boolean;
        pincode: boolean;
        sso: boolean;
        whitelist: boolean;
    };
    resource: {
        name: string;
        id: number;
    };
    redirect: string;
    idps?: LoginFormIDP[];
    customization?: {
        authCustomCSS?: string | null;
        authCustomHTML?: string | null;
        authCustomLogo?: string | null;
        authCustomTitle?: string | null;
        authCustomDescription?: string | null;
        authCustomBackground?: string | null;
        authCustomEnabled?: boolean;
    };
};

export default function ResourceAuthPortal(props: ResourceAuthPortalProps) {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);

    const getNumMethods = () => {
        let colLength = 0;
        if (props.methods.pincode) colLength++;
        if (props.methods.password) colLength++;
        if (props.methods.sso) colLength++;
        if (props.methods.whitelist) colLength++;
        return colLength;
    };

    const [numMethods, setNumMethods] = useState(getNumMethods());

    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [pincodeError, setPincodeError] = useState<string | null>(null);
    const [whitelistError, setWhitelistError] = useState<string | null>(null);
    const [accessDenied, setAccessDenied] = useState<boolean>(false);
    const [loadingLogin, setLoadingLogin] = useState(false);

    const [otpState, setOtpState] = useState<"idle" | "otp_sent">("idle");

    const { env } = useEnvContext();

    const api = createApiClient({ env });

    const { supporterStatus } = useSupporterStatusContext();

    function getDefaultSelectedMethod() {
        if (props.methods.sso) {
            return "sso";
        }

        if (props.methods.password) {
            return "password";
        }

        if (props.methods.pincode) {
            return "pin";
        }

        if (props.methods.whitelist) {
            return "whitelist";
        }
    }

    const [activeTab, setActiveTab] = useState(getDefaultSelectedMethod());

    const pinForm = useForm<z.infer<typeof pinSchema>>({
        resolver: zodResolver(pinSchema),
        defaultValues: {
            pin: ""
        }
    });

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            password: ""
        }
    });

    const requestOtpForm = useForm<z.infer<typeof requestOtpSchema>>({
        resolver: zodResolver(requestOtpSchema),
        defaultValues: {
            email: ""
        }
    });

    const submitOtpForm = useForm<z.infer<typeof submitOtpSchema>>({
        resolver: zodResolver(submitOtpSchema),
        defaultValues: {
            email: "",
            otp: ""
        }
    });

    function appendRequestToken(url: string, token: string) {
        const fullUrl = new URL(url);
        fullUrl.searchParams.append(
            env.server.resourceSessionRequestParam,
            token
        );
        return fullUrl.toString();
    }

    const onWhitelistSubmit = (values: any) => {
        setLoadingLogin(true);
        api.post<AxiosResponse<AuthWithWhitelistResponse>>(
            `/auth/resource/${props.resource.id}/whitelist`,
            { email: values.email, otp: values.otp }
        )
            .then((res) => {
                setWhitelistError(null);

                if (res.data.data.otpSent) {
                    setOtpState("otp_sent");
                    submitOtpForm.setValue("email", values.email);
                    toast({
                        title: "OTP Sent",
                        description: "An OTP has been sent to your email"
                    });
                    return;
                }

                const session = res.data.data.session;
                if (session) {
                    window.location.href = appendRequestToken(
                        props.redirect,
                        session
                    );
                }
            })
            .catch((e) => {
                console.error(e);
                setWhitelistError(
                    formatAxiosError(e, "Failed to authenticate with email")
                );
            })
            .then(() => setLoadingLogin(false));
    };

    const onPinSubmit = (values: z.infer<typeof pinSchema>) => {
        setLoadingLogin(true);
        api.post<AxiosResponse<AuthWithPasswordResponse>>(
            `/auth/resource/${props.resource.id}/pincode`,
            { pincode: values.pin }
        )
            .then((res) => {
                setPincodeError(null);
                const session = res.data.data.session;
                if (session) {
                    window.location.href = appendRequestToken(
                        props.redirect,
                        session
                    );
                }
            })
            .catch((e) => {
                console.error(e);
                setPincodeError(
                    formatAxiosError(e, "Failed to authenticate with pincode")
                );
            })
            .then(() => setLoadingLogin(false));
    };

    const onPasswordSubmit = (values: z.infer<typeof passwordSchema>) => {
        setLoadingLogin(true);

        api.post<AxiosResponse<AuthWithPasswordResponse>>(
            `/auth/resource/${props.resource.id}/password`,
            {
                password: values.password
            }
        )
            .then((res) => {
                setPasswordError(null);
                const session = res.data.data.session;
                if (session) {
                    window.location.href = appendRequestToken(
                        props.redirect,
                        session
                    );
                }
            })
            .catch((e) => {
                console.error(e);
                setPasswordError(
                    formatAxiosError(e, "Failed to authenticate with password")
                );
            })
            .finally(() => setLoadingLogin(false));
    };

    async function handleSSOAuth() {
        let isAllowed = false;
        try {
            await api.get(`/resource/${props.resource.id}`);
            isAllowed = true;
        } catch (e) {
            setAccessDenied(true);
        }

        if (isAllowed) {
            // window.location.href = props.redirect;
            router.refresh();
        }
    }

    return (
        <div 
            className="resource-auth-container"
            style={{
                ...(props.customization?.authCustomBackground && {
                    background: props.customization.authCustomBackground
                })
            }}
        >
            {/* Custom CSS */}
            {props.customization?.authCustomEnabled && props.customization?.authCustomCSS && (
                <style dangerouslySetInnerHTML={{ 
                    __html: props.customization.authCustomCSS 
                }} />
            )}
            
            {/* Custom HTML */}
            {props.customization?.authCustomEnabled && props.customization?.authCustomHTML && (
                <div 
                    className="auth-custom-html-content"
                    dangerouslySetInnerHTML={{ __html: props.customization.authCustomHTML }} 
                />
            )}
            
            {!accessDenied ? (
                <div className="resource-auth-content flex flex-col items-center justify-center min-h-screen p-4">
                    {/* Enhanced Header with Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="auth-logo-container mb-6">
                            <div className="auth-logo-glow"></div>
                            <div className="relative bg-white dark:bg-gray-800 rounded-full p-4 shadow-xl border border-gray-200 dark:border-gray-700">
                                <Image
                                    src={props.customization?.authCustomEnabled && props.customization?.authCustomLogo 
                                        ? props.customization.authCustomLogo 
                                        : "/logo/pangolin_orange.svg"}
                                    alt="Logo"
                                    width={64}
                                    height={64}
                                    className="w-16 h-16"
                                />
                            </div>
                        </div>
                        
                        <div className="text-center">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                                {props.customization?.authCustomEnabled && props.customization?.authCustomTitle 
                                    ? props.customization.authCustomTitle 
                                    : "Secure Access Portal"}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                {props.customization?.authCustomEnabled && props.customization?.authCustomDescription 
                                    ? props.customization.authCustomDescription 
                                    : (<>
                                        Powered by{" "}
                                        <Link
                                            href="https://github.com/fosrl/pangolin"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="underline hover:text-blue-600 transition-colors"
                                        >
                                            Pangolin
                                        </Link>
                                    </>)}
                            </p>
                            <div className="security-badge mt-2">
                                <Shield className="security-badge-icon" />
                                <span>Secured Connection</span>
                            </div>
                            <div className="mt-3">
                                <SecurityStatus 
                                    isSecure={true}
                                    connectionType="https"
                                    authMethod={activeTab as any}
                                />
                            </div>
                        </div>
                    </div>
                    <Card className="auth-card-enhanced">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <LockIcon className="w-5 h-5" />
                                Authentication Required
                            </CardTitle>
                            <CardDescription>
                                {numMethods > 1
                                    ? `Choose your preferred method to access ${props.resource.name}`
                                    : `You must authenticate to access ${props.resource.name}`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs
                                value={activeTab}
                                onValueChange={setActiveTab}
                                orientation="horizontal"
                                className="auth-tabs-enhanced"
                            >
                                {numMethods > 1 && (
                                    <TabsList
                                        className={`grid w-full ${
                                            numMethods === 1
                                                ? "grid-cols-1"
                                                : numMethods === 2
                                                  ? "grid-cols-2"
                                                  : numMethods === 3
                                                    ? "grid-cols-3"
                                                    : "grid-cols-4"
                                        }`}
                                    >
                                        {props.methods.pincode && (
                                            <TabsTrigger value="pin" className="auth-tab-enhanced">
                                                <Binary className="w-4 h-4 mr-1" />{" "}
                                                PIN
                                            </TabsTrigger>
                                        )}
                                        {props.methods.password && (
                                            <TabsTrigger value="password" className="auth-tab-enhanced">
                                                <Key className="w-4 h-4 mr-1" />{" "}
                                                Password
                                            </TabsTrigger>
                                        )}
                                        {props.methods.sso && (
                                            <TabsTrigger value="sso" className="auth-tab-enhanced">
                                                <User className="w-4 h-4 mr-1" />{" "}
                                                User
                                            </TabsTrigger>
                                        )}
                                        {props.methods.whitelist && (
                                            <TabsTrigger value="whitelist" className="auth-tab-enhanced">
                                                <AtSign className="w-4 h-4 mr-1" />{" "}
                                                Email
                                            </TabsTrigger>
                                        )}
                                    </TabsList>
                                )}
                                {props.methods.pincode && (
                                    <TabsContent
                                        value="pin"
                                        className={`${numMethods <= 1 ? "mt-0" : ""}`}
                                    >
                                        <Form {...pinForm}>
                                            <form
                                                onSubmit={pinForm.handleSubmit(
                                                    onPinSubmit
                                                )}
                                                className="space-y-4"
                                            >
                                                <FormField
                                                    control={pinForm.control}
                                                    name="pin"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                6-digit PIN Code
                                                            </FormLabel>
                                                            <FormControl>
                                                                <div className="flex justify-center">
                                                                    <InputOTP
                                                                        maxLength={
                                                                            6
                                                                        }
                                                                        {...field}
                                                                    >
                                                                        <InputOTPGroup className="flex">
                                                                            <InputOTPSlot
                                                                                index={
                                                                                    0
                                                                                }
                                                                                obscured
                                                                            />
                                                                            <InputOTPSlot
                                                                                index={
                                                                                    1
                                                                                }
                                                                                obscured
                                                                            />
                                                                            <InputOTPSlot
                                                                                index={
                                                                                    2
                                                                                }
                                                                                obscured
                                                                            />
                                                                            <InputOTPSlot
                                                                                index={
                                                                                    3
                                                                                }
                                                                                obscured
                                                                            />
                                                                            <InputOTPSlot
                                                                                index={
                                                                                    4
                                                                                }
                                                                                obscured
                                                                            />
                                                                            <InputOTPSlot
                                                                                index={
                                                                                    5
                                                                                }
                                                                                obscured
                                                                            />
                                                                        </InputOTPGroup>
                                                                    </InputOTP>
                                                                </div>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                {pincodeError && (
                                                    <Alert variant="destructive">
                                                        <AlertDescription>
                                                            {pincodeError}
                                                        </AlertDescription>
                                                    </Alert>
                                                )}
                                                <Button
                                                    type="submit"
                                                    className="w-full auth-button-enhanced"
                                                    loading={loadingLogin}
                                                    disabled={loadingLogin}
                                                >
                                                    {loadingLogin ? (
                                                        <div className="auth-loading-spinner mr-2" />
                                                    ) : (
                                                        <LockIcon className="w-4 h-4 mr-2" />
                                                    )}
                                                    Log in with PIN
                                                </Button>
                                            </form>
                                        </Form>
                                    </TabsContent>
                                )}
                                {props.methods.password && (
                                    <TabsContent
                                        value="password"
                                        className={`${numMethods <= 1 ? "mt-0" : ""}`}
                                    >
                                        <Form {...passwordForm}>
                                            <form
                                                onSubmit={passwordForm.handleSubmit(
                                                    onPasswordSubmit
                                                )}
                                                className="space-y-4"
                                            >
                                                <FormField
                                                    control={
                                                        passwordForm.control
                                                    }
                                                    name="password"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>
                                                                Password
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="password"
                                                                    className="auth-input-enhanced"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                {passwordError && (
                                                    <Alert variant="destructive">
                                                        <AlertDescription>
                                                            {passwordError}
                                                        </AlertDescription>
                                                    </Alert>
                                                )}

                                                <Button
                                                    type="submit"
                                                    className="w-full auth-button-enhanced"
                                                    loading={loadingLogin}
                                                    disabled={loadingLogin}
                                                >
                                                    {loadingLogin ? (
                                                        <div className="auth-loading-spinner mr-2" />
                                                    ) : (
                                                        <LockIcon className="w-4 h-4 mr-2" />
                                                    )}
                                                    Log In with Password
                                                </Button>
                                            </form>
                                        </Form>
                                    </TabsContent>
                                )}
                                {props.methods.sso && (
                                    <TabsContent
                                        value="sso"
                                        className={`${numMethods <= 1 ? "mt-0" : ""}`}
                                    >
                                        <LoginForm
                                            idps={props.idps}
                                            redirect={props.redirect}
                                            onLogin={async () =>
                                                await handleSSOAuth()
                                            }
                                        />
                                    </TabsContent>
                                )}
                                {props.methods.whitelist && (
                                    <TabsContent
                                        value="whitelist"
                                        className={`${numMethods <= 1 ? "mt-0" : ""}`}
                                    >
                                        {otpState === "idle" && (
                                            <Form {...requestOtpForm}>
                                                <form
                                                    onSubmit={requestOtpForm.handleSubmit(
                                                        onWhitelistSubmit
                                                    )}
                                                    className="space-y-4"
                                                >
                                                    <FormField
                                                        control={
                                                            requestOtpForm.control
                                                        }
                                                        name="email"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    Email
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="email"
                                                                        className="auth-input-enhanced"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormDescription>
                                                                    A one-time
                                                                    code will be
                                                                    sent to this
                                                                    email.
                                                                </FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {whitelistError && (
                                                        <Alert variant="destructive">
                                                            <AlertDescription>
                                                                {whitelistError}
                                                            </AlertDescription>
                                                        </Alert>
                                                    )}

                                                    <Button
                                                        type="submit"
                                                        className="w-full auth-button-enhanced"
                                                        loading={loadingLogin}
                                                        disabled={loadingLogin}
                                                    >
                                                        {loadingLogin ? (
                                                            <div className="auth-loading-spinner mr-2" />
                                                        ) : (
                                                            <Send className="w-4 h-4 mr-2" />
                                                        )}
                                                        Send One-time Code
                                                    </Button>
                                                </form>
                                            </Form>
                                        )}

                                        {otpState === "otp_sent" && (
                                            <Form {...submitOtpForm}>
                                                <form
                                                    onSubmit={submitOtpForm.handleSubmit(
                                                        onWhitelistSubmit
                                                    )}
                                                    className="space-y-4"
                                                >
                                                    <FormField
                                                        control={
                                                            submitOtpForm.control
                                                        }
                                                        name="otp"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>
                                                                    One-Time
                                                                    Password
                                                                    (OTP)
                                                                </FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="password"
                                                                        className="auth-input-enhanced"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    {whitelistError && (
                                                        <Alert variant="destructive">
                                                            <AlertDescription>
                                                                {whitelistError}
                                                            </AlertDescription>
                                                        </Alert>
                                                    )}

                                                    <Button
                                                        type="submit"
                                                        className="w-full auth-button-enhanced"
                                                        loading={loadingLogin}
                                                        disabled={loadingLogin}
                                                    >
                                                        {loadingLogin ? (
                                                            <div className="auth-loading-spinner mr-2" />
                                                        ) : (
                                                            <LockIcon className="w-4 h-4 mr-2" />
                                                        )}
                                                        Submit OTP
                                                    </Button>

                                                    <Button
                                                        type="button"
                                                        className="w-full"
                                                        variant={"outline"}
                                                        onClick={() => {
                                                            setOtpState("idle");
                                                            submitOtpForm.reset();
                                                        }}
                                                    >
                                                        Back to Email
                                                    </Button>
                                                </form>
                                            </Form>
                                        )}
                                    </TabsContent>
                                )}
                            </Tabs>
                        </CardContent>
                    </Card>
                    {supporterStatus?.visible && (
                        <div className="text-center mt-2">
                            <span className="text-sm text-muted-foreground opacity-50">
                                Server is running without a supporter key.
                                <br />
                                Consider supporting the project!
                            </span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="resource-auth-content flex flex-col items-center justify-center min-h-screen p-4">
                    <ResourceAccessDenied />
                </div>
            )}
        </div>
    );
}
