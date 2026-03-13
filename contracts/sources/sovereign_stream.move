module sovereign_stream::content_registry {
    use std::signer;
    use std::string::String;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::event;
    use aptos_framework::table::{Self, Table};

    struct ContentStore has key {
        contents: Table<u64, ContentMetadata>,
        next_id: u64,
    }

    struct ContentMetadata has store, drop, copy {
        creator: address,
        shelby_blob_id: String,
        title: String,
        description: String,
        content_type: String,
        price_octas: u64,
        total_views: u64,
        total_earned: u64,
    }

    struct AccessRegistry has key {
        access_records: Table<AccessKey, bool>,
    }

    struct AccessKey has store, drop, copy {
        user: address,
        content_id: u64,
    }

    #[event]
    struct ContentRegistered has drop, store {
        content_id: u64,
        creator: address,
        shelby_blob_id: String,
        price_octas: u64,
    }

    #[event]
    struct AccessPurchased has drop, store {
        content_id: u64,
        buyer: address,
        creator: address,
        price_octas: u64,
    }

    fun init_module(account: &signer) {
        move_to(account, ContentStore {
            contents: table::new(),
            next_id: 1,
        });
        move_to(account, AccessRegistry {
            access_records: table::new(),
        });
    }

    public entry fun register_content(
        creator: &signer,
        shelby_blob_id: String,
        title: String,
        description: String,
        content_type: String,
        price_octas: u64,
    ) acquires ContentStore {
        let creator_addr = signer::address_of(creator);
        let store = borrow_global_mut<ContentStore>(@sovereign_stream);
        let content_id = store.next_id;

        let metadata = ContentMetadata {
            creator: creator_addr,
            shelby_blob_id,
            title,
            description,
            content_type,
            price_octas,
            total_views: 0,
            total_earned: 0,
        };

        table::add(&mut store.contents, content_id, metadata);
        store.next_id = content_id + 1;

        event::emit(ContentRegistered {
            content_id,
            creator: creator_addr,
            shelby_blob_id,
            price_octas,
        });
    }

    public entry fun purchase_access(
        buyer: &signer,
        content_id: u64,
    ) acquires ContentStore, AccessRegistry {
        let buyer_addr = signer::address_of(buyer);
        let store = borrow_global_mut<ContentStore>(@sovereign_stream);
        let content = table::borrow_mut(&mut store.contents, content_id);

        assert!(buyer_addr != content.creator, 1);

        let access_registry = borrow_global_mut<AccessRegistry>(@sovereign_stream);
        let access_key = AccessKey { user: buyer_addr, content_id };
        assert!(!table::contains(&access_registry.access_records, access_key), 2);

        coin::transfer<AptosCoin>(buyer, content.creator, content.price_octas);

        table::add(&mut access_registry.access_records, access_key, true);
        content.total_views = content.total_views + 1;
        content.total_earned = content.total_earned + content.price_octas;

        event::emit(AccessPurchased {
            content_id,
            buyer: buyer_addr,
            creator: content.creator,
            price_octas: content.price_octas,
        });
    }

    #[view]
    public fun has_access(user: address, content_id: u64): bool acquires AccessRegistry {
        let registry = borrow_global<AccessRegistry>(@sovereign_stream);
        let key = AccessKey { user, content_id };
        table::contains(&registry.access_records, key)
    }

    #[view]
    public fun get_content(content_id: u64): ContentMetadata acquires ContentStore {
        let store = borrow_global<ContentStore>(@sovereign_stream);
        *table::borrow(&store.contents, content_id)
    }
}
