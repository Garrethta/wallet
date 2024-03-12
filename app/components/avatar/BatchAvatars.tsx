import { memo, useMemo } from "react";
import { ThemeType } from "../../engine/state/theme";
import { Avatar, AvatarIcProps, avatarColors } from "./Avatar";
import { PerfView } from "../basic/PerfView";
import { WalletSettings } from "../../engine/state/walletSettings";
import { avatarHash } from "../../utils/avatarHash";
import { AddressContact } from "../../engine/hooks/contacts/useAddressBook";
import { Address, Cell } from "@ton/core";
import { KnownJettonMasters } from "../../secure/KnownWallets";
import { StoredMessage } from "../../engine/types/transactions";
import { resolveOperation } from "../../engine/transactions/resolveOperation";
import { parseBody } from "../../engine/transactions/parseWalletTransaction";
import { SelectedAccount } from "../../engine/types";

export const BatchAvatar = memo(({
    message,
    size,
    icProps,
    theme,
    isTestnet,
    borderWidth,
    walletsSettings,
    denyList,
    contacts,
    spamWallets,
    showSpambadge,
    ownAccounts
}: {
    message: StoredMessage,
    size: number,
    icProps: AvatarIcProps,
    theme: ThemeType,
    isTestnet: boolean,
    borderColor?: string,
    borderWidth?: number,
    backgroundColor?: string,
    walletsSettings?: { [key: string]: WalletSettings },
    denyList: { [key: string]: { reason: string | null } },
    contacts: { [key: string]: AddressContact },
    spamWallets: string[],
    showSpambadge?: boolean,
    ownAccounts: SelectedAccount[]
}) => {
    const addressString = message.info.type === 'internal' ? message.info.dest : null;

    const address = useMemo(() => {
        if (!addressString) {
            return null;
        }
        try {
            return Address.parse(addressString);
        } catch (error) {
            return null;
        }
    }, [addressString]);

    if (message.info.type !== 'internal') {  // for type safety in amount
        return null;
    }

    const amount = BigInt(message.info.value || '0');
    const bodyCell = Cell.fromBoc(Buffer.from(message.body, 'base64'))[0];
    const body = parseBody(bodyCell);

    if (!address || !addressString) {
        return null;
    }

    // to get jetton destination address
    const operation = resolveOperation({
        body: body,
        amount: amount,
        account: address,
    }, isTestnet);

    const friendlyTarget = operation.address;
    const target = Address.parse(friendlyTarget);
    const opAddressBounceable = target.toString({ testOnly: isTestnet });
    const verified = !!KnownJettonMasters(isTestnet)[opAddressBounceable];
    const walletSettings = walletsSettings?.[opAddressBounceable];
    const avatarColorHash = walletSettings?.color ?? avatarHash(addressString, avatarColors.length);
    const avatarColor = avatarColors[avatarColorHash];
    const spam = !!denyList[opAddressBounceable] || spamWallets.includes(addressString);
    const contact = contacts[opAddressBounceable];
    const isOwn = !!ownAccounts.find((a) => a.address.equals(target));

    return (
        <Avatar
            size={size}
            address={opAddressBounceable}
            id={opAddressBounceable}
            borderWith={borderWidth}
            spam={spam}
            markContact={!!contact}
            icProps={{ ...icProps, isOwn }}
            theme={theme}
            isTestnet={isTestnet}
            backgroundColor={avatarColor}
            hash={walletSettings?.avatar}
            verified={verified}
            showSpambadge={showSpambadge}
        />
    );
});

export const BatchAvatars = memo(({
    messages,
    size,
    icProps,
    theme,
    isTestnet,
    borderColor,
    borderWidth,
    backgroundColor,
    walletsSettings,
    denyList,
    contacts,
    spamWallets,
    showSpambadge,
    ownAccounts
}: {
    messages: StoredMessage[],
    size: number,
    icProps: AvatarIcProps,
    theme: ThemeType,
    isTestnet: boolean,
    borderColor?: string,
    borderWidth?: number,
    backgroundColor?: string,
    walletsSettings?: { [key: string]: WalletSettings },
    denyList: { [key: string]: { reason: string | null } },
    contacts: { [key: string]: AddressContact },
    spamWallets: string[],
    showSpambadge?: boolean,
    ownAccounts: SelectedAccount[]
}) => {

    if (messages.length <= 1) {
        return null;
    }

    const innerSize = size - (borderWidth ?? 2);
    let avatarSizeCoefficient = 2;
    if (messages.length === 3) {
        avatarSizeCoefficient = 2.3;
    } else if (messages.length === 4) {
        avatarSizeCoefficient = 2.6;
    }
    const avatarSize = (innerSize) / avatarSizeCoefficient;

    return (
        <PerfView style={{
            backgroundColor: borderColor ?? theme.surfaceOnElevation,
            height: size,
            width: size,
            borderRadius: size,
            justifyContent: 'center', alignItems: 'center',
            overflow: 'hidden'
        }}>
            <PerfView style={{
                height: innerSize,
                width: innerSize,
                borderRadius: innerSize / 2,
                overflow: 'hidden',
                backgroundColor: backgroundColor ?? theme.backgroundPrimary,
                display: 'flex', flexDirection: 'row', flexWrap: 'wrap',
                alignItems: 'center', justifyContent: 'center', alignContent: 'center',
                paddingTop: messages.length === 3 ? size * 0.07 : 0
            }}>
                {messages.map((message, index) => {
                    return (
                        <PerfView style={{ marginTop: messages.length === 3 ? -size * 0.056 : 0 }}>
                            <BatchAvatar
                                key={`batch-avatar-${index}`}
                                message={message}
                                size={avatarSize}
                                icProps={icProps}
                                theme={theme}
                                isTestnet={isTestnet}
                                borderWidth={0}
                                walletsSettings={walletsSettings}
                                denyList={denyList}
                                contacts={contacts}
                                spamWallets={spamWallets}
                                showSpambadge={showSpambadge}
                                ownAccounts={ownAccounts}
                            />
                        </PerfView>
                    );
                })}
            </PerfView>
        </PerfView>
    );
});