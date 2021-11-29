import { FC } from 'react'
import { Box, Flex, Text, Code, Link, Avatar } from '@chakra-ui/react'
import { BiWallet } from 'react-icons/bi'

interface WalletProps {
  ensName: string
  selectedAsset?: any
  account: string
  logout: any
}

const Wallet: FC<WalletProps> = ({ ensName, account, selectedAsset, logout }) => {
  const avatarLink = selectedAsset && selectedAsset.avatar.startsWith('https://')
    ? selectedAsset.avatar : `${process.env.REACT_APP_AVATAR_API_URI}/address/${account}`

  return (
    <>
      <Box as={Flex} alignItems={'center'}>
        <Box
          p={2}
          px={{ base: 0, md: 3 }}
          d={'flex'}
          cursor={'pointer'}
          justifyContent={'space-between'}
          alignItems={'center'}
          rounded={'5'}
          bg="#FAFAFA"
        >
          <BiWallet size="20" /> 
          <Text ml={1} mr={1} cursor={'pointer'} onClick={logout} title={'Click to logout'}>
            <Code>
              {
                ensName ? ensName : `${account.substr(0, 8)}...${account.substr(-8)}`
              }
            </Code>
          </Text>
          {avatarLink ? <Link href={avatarLink} target={'_blank'}><Avatar size={'xs'} src={`${avatarLink}?w=24`} /></Link> : ''}
        </Box>
      </Box>
    </>
  )
}

export default Wallet
