// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GuitarFiSmartContract {
    address public owner;

address public gtrToken;
address public nftCollection;
address public identityNFT;
address public usdtToken;

bool public paused;

mapping(address => uint256) public streak;
mapping(address => uint256) public highestStreak;
mapping(address => uint256) public lastCheckInDay;

mapping(address => uint256) public pendingTokens;
mapping(address => uint256) public totalEarnedTokens;

mapping(address => mapping(uint256 => uint256))
    public pendingNFTs;

mapping(address => uint256) public dailyTapCount;
mapping(address => uint256) public lastTapDay;
mapping(address => bool) public dailyTapBonusClaimed;


// ---------- CONSTANTS ----------
uint256 public constant TAP_REWARD = 0.01 ether;
uint256 public constant DAILY_TAP_BONUS = 10 ether;
uint256 public constant TUNE_COST = 50 ether;

// ---------- EVENTS ----------
event CheckedIn(
    address indexed user,
    uint256 streak,
    uint256 reward
);

event TapReward(
    address indexed user,
    uint256 reward
);

event TunePlayed(
    address indexed user,
    uint256 cost
);

event NFTUnlocked(
    address indexed user,
    uint256 nftId,
    uint256 amount
);

event TokensClaimed(
    address indexed user,
    uint256 amount
);

event NFTsClaimed(
    address indexed user,
    uint256 nftId,
    uint256 amount
);

event ConvertedToGTR(
    address indexed user,
    uint256 gtrAmount
);

event OwnershipTransferred(
    address indexed oldOwner,
    address indexed newOwner
);

// ---------- MODIFIERS ----------
modifier onlyOwner() {
    require(msg.sender == owner, "Not owner");
    _;
}

modifier notPaused() {
    require(!paused, "Paused");
    _;
}


// ---------- CONSTRUCTOR ----------
constructor() {
    owner = msg.sender;
}




// ---------- CONVERT RATES ----------

uint256 public constant USDT_TO_GTR = 1000;
uint256 public constant ETH_TO_GTR = 100;






// ---------- INTERNAL HELPERS ----------

function getDay() public view returns (uint256) {
    return block.timestamp / 1 days;
}

function _hasIdentity(address user) internal view returns (bool) {
    if (identityNFT == address(0)) {
        return true;
    }

    (bool success, bytes memory data) = identityNFT.staticcall(
        abi.encodeWithSignature(
            "balanceOf(address)",
            user
        )
    );

    if (!success || data.length == 0) {
        return false;
    }

    uint256 balance = abi.decode(
        data,
        (uint256)
    );

    return balance > 0;
}

function _mintGTR(
    address to,
    uint256 amount
) internal {
    if (amount == 0) return;

    (bool success, ) = gtrToken.call(
        abi.encodeWithSignature(
            "mint(address,uint256)",
            to,
            amount
        )
    );

    require(
        success,
        "GTR mint failed"
    );
}

function _mintNFT(
    address to,
    uint256 id,
    uint256 amount
) internal {
    if (amount == 0) return;

    (bool success, ) = nftCollection.call(
        abi.encodeWithSignature(
            "mint(address,uint256,uint256)",
            to,
            id,
            amount
        )
    );

    require(
        success,
        "NFT mint failed"
    );
}


// ---------- GM CHECK-IN ----------

function checkIn()
    external
    notPaused
{
    require(
        _hasIdentity(msg.sender),
        "Mint Identity First"
    );

    uint256 today = getDay();

    require(
        lastCheckInDay[msg.sender] != today,
        "Already checked in"
    );

    if (
        lastCheckInDay[msg.sender] + 1 ==
        today
    ) {
        streak[msg.sender]++;
    } else {
        streak[msg.sender] = 1;
    }

    lastCheckInDay[msg.sender] = today;

    if (
        streak[msg.sender] >
        highestStreak[msg.sender]
    ) {
        highestStreak[msg.sender] =
            streak[msg.sender];
    }

    uint256 reward =
        streak[msg.sender] * 1 ether;

    pendingTokens[msg.sender] +=
        reward;

    totalEarnedTokens[msg.sender] +=
        reward;

    uint256 nftId =
        ((streak[msg.sender] - 1) % 30)
            + 1;

    pendingNFTs[msg.sender][nftId]++;

    emit NFTUnlocked(
        msg.sender,
        nftId,
        1
    );

    emit CheckedIn(
        msg.sender,
        streak[msg.sender],
        reward
    );
}


// ---------- TAP ----------

function tap()
    external
    notPaused
{
    require(
        _hasIdentity(msg.sender),
        "Mint Identity First"
    );

    uint256 today = getDay();

    if (
        lastTapDay[msg.sender] != today
    ) {
        lastTapDay[msg.sender] = today;

        dailyTapCount[msg.sender] = 0;

        dailyTapBonusClaimed[msg.sender] = false;
    }

    dailyTapCount[msg.sender]++;

    // Instant 0.01 GTR reward
    _mintGTR(
        msg.sender,
        TAP_REWARD
    );

    emit TapReward(
        msg.sender,
        TAP_REWARD
    );

    // First daily 10th tap bonus
    if (
        dailyTapCount[msg.sender] == 10 &&
        !dailyTapBonusClaimed[msg.sender]
    ) {
        pendingTokens[msg.sender] +=
            DAILY_TAP_BONUS;

        totalEarnedTokens[msg.sender] +=
            DAILY_TAP_BONUS;

        dailyTapBonusClaimed[msg.sender] =
            true;
    }
}


// ---------- PLAY TUNE ----------

function playTune()
    external
    notPaused
{
    require(
        _hasIdentity(msg.sender),
        "Mint Identity First"
    );

    (bool success, ) = gtrToken.call(
        abi.encodeWithSignature(
            "burnFrom(address,uint256)",
            msg.sender,
            TUNE_COST
        )
    );

    require(
        success,
        "Burn failed"
    );

    pendingNFTs[msg.sender][31]++;

    emit NFTUnlocked(
        msg.sender,
        31,
        1
    );

    emit TunePlayed(
        msg.sender,
        TUNE_COST
    );
}


// ---------- CONVERT USDT TO GTR ----------

function convertUSDTToGTR(
    uint256 usdtAmount
)
    external
    notPaused
{
    require(
        usdmAmount > 0,
        "Invalid amount"
    );

    (bool success, bytes memory data) =
        usdmToken.call(
            abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                msg.sender,
                address(this),
                usdmAmount
            )
        );

    require(
        success,
        "USDM transfer failed"
    );

    if (data.length > 0) {
        require(
            abi.decode(data, (bool)),
            "Transfer failed"
        );
    }

    uint256 gtrAmount =
        usdmAmount *
        USDM_TO_GTR;

    _mintGTR(
        msg.sender,
        gtrAmount
    );

    emit ConvertedToGTR(
        msg.sender,
        gtrAmount
    );
}


// ---------- CONVERT CELO TO GTR ----------

function convertCELOToGTR()
    external
    payable
    notPaused
{
    require(
        msg.value > 0,
        "No CELO sent"
    );

    uint256 gtrAmount =
        msg.value *
        CELO_TO_GTR;

    _mintGTR(
        msg.sender,
        gtrAmount
    );

    emit ConvertedToGTR(
        msg.sender,
        gtrAmount
    );
}


// ---------- CLAIM TOKENS ----------

function claimTokens()
    public
    notPaused
{
    uint256 amount =
        pendingTokens[msg.sender];

    require(
        amount > 0,
        "No pending tokens"
    );

    pendingTokens[msg.sender] = 0;

    _mintGTR(
        msg.sender,
        amount
    );

    emit TokensClaimed(
        msg.sender,
        amount
    );
}

// ---------- CLAIM ALL NFTS ----------

function claimAllNFTs()
    public
    notPaused
{
    bool hasNFT = false;

    for (
        uint256 id = 1;
        id <= 31;
        id++
    ) {
        uint256 amount =
            pendingNFTs[msg.sender][id];

        if (amount > 0) {
            pendingNFTs[msg.sender][id] = 0;

            _mintNFT(
                msg.sender,
                id,
                amount
            );

            emit NFTsClaimed(
                msg.sender,
                id,
                amount
            );

            hasNFT = true;
        }
    }

    require(
        hasNFT,
        "No pending NFTs"
    );
}



// ---------- CLAIM EVERYTHING ----------

function claimAll()
    external
{
    claimTokens();
    claimAllNFTs();
}



// ---------- ADMIN ----------

function setPaused(
    bool _paused
)
    external
    onlyOwner
{
    paused = _paused;
}

function setIdentityNFT(
    address _identityNFT
)
    external
    onlyOwner
{
    identityNFT = _identityNFT;
}

function setNFTCollection(
    address _nftCollection
)
    external
    onlyOwner
{
    nftCollection = _nftCollection;
}

function setUSDMToken(
    address _usdmToken
)
    external
    onlyOwner
{
    usdmToken = _usdmToken;
}

function transferOwnership(
    address newOwner
)
    external
    onlyOwner
{
    require(
        newOwner != address(0),
        "Invalid address"
    );

    address oldOwner = owner;

    owner = newOwner;

    emit OwnershipTransferred(
        oldOwner,
        newOwner
    );
}


//

function withdrawCELO(
    uint256 amount
)
    external
    onlyOwner
{
    require(
        address(this).balance >= amount,
        "Insufficient balance"
    );

    payable(owner).transfer(
        amount
    );
}

function withdrawUSDM(
    uint256 amount
)
    external
    onlyOwner
{
    (bool success, bytes memory data) =
        usdmToken.call(
            abi.encodeWithSignature(
                "transfer(address,uint256)",
                owner,
                amount
            )
        );

    require(
        success,
        "Withdraw failed"
    );

    if (data.length > 0) {
        require(
            abi.decode(data, (bool)),
            "Transfer failed"
        );
    }
}

function emergencyWithdrawToken(
    address token,
    uint256 amount
)
    external
    onlyOwner
{
    (bool success, ) = token.call(
        abi.encodeWithSignature(
            "transfer(address,uint256)",
            owner,
            amount
        )
    );

    require(
        success,
        "Withdraw failed"
    );
}


function setGTRToken(
    address _gtrToken
)
    external
    onlyOwner
{
    gtrToken = _gtrToken;
}

receive() external payable {}

}