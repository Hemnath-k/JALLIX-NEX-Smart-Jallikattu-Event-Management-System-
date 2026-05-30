import os
from datetime import datetime, timedelta
import random

from app import app
from models import db, User, Bull, Tamer, Event, Sponsor, EventSlot, Booking, BullEvent, TamerEvent, Payment, Certificate, Session
from utils import hash_password

def seed_database():
    with app.app_context():
        print("Starting database seed...")
        
        # 1. Create Users
        users_data = [
            {'name': 'Super Admin', 'email': 'admin@jallixnex.com', 'role': 'admin', 'phone': '9876543210', 'pwd': 'admin123'},
            {'name': 'Raja Kumar', 'email': 'owner1@jallixnex.com', 'role': 'owner', 'phone': '9876543211', 'pwd': 'owner123'},
            {'name': 'Karthik Pandian', 'email': 'owner2@example.com', 'role': 'owner', 'phone': '9944332211', 'pwd': 'owner123'},
            {'name': 'Selvamani', 'email': 'owner3@example.com', 'role': 'owner', 'phone': '9844332212', 'pwd': 'owner123'},
            {'name': 'Sundar', 'email': 'owner4@example.com', 'role': 'owner', 'phone': '9844332213', 'pwd': 'owner123'},
            {'name': 'Veerappan', 'email': 'owner5@example.com', 'role': 'owner', 'phone': '9844332214', 'pwd': 'owner123'},
            {'name': 'Pandi', 'email': 'owner6@example.com', 'role': 'owner', 'phone': '9844332215', 'pwd': 'owner123'},
            {'name': 'Suresh', 'email': 'owner7@example.com', 'role': 'owner', 'phone': '9844332216', 'pwd': 'owner123'},
            {'name': 'Ramesh', 'email': 'owner8@example.com', 'role': 'owner', 'phone': '9844332217', 'pwd': 'owner123'},
            {'name': 'Ganesan', 'email': 'owner9@example.com', 'role': 'owner', 'phone': '9844332218', 'pwd': 'owner123'},
            {'name': 'Murugan', 'email': 'owner10@example.com', 'role': 'owner', 'phone': '9844332219', 'pwd': 'owner123'},
            {'name': 'Muthu Vel', 'email': 'tamer1@jallixnex.com', 'role': 'tamer', 'phone': '9876543212', 'pwd': 'tamer123'},
            {'name': 'Arumugam', 'email': 'tamer2@example.com', 'role': 'tamer', 'phone': '9744332213', 'pwd': 'tamer123'},
            {'name': 'Saravanan', 'email': 'tamer3@example.com', 'role': 'tamer', 'phone': '9744332214', 'pwd': 'tamer123'},
            {'name': 'Vignesh', 'email': 'tamer4@example.com', 'role': 'tamer', 'phone': '9744332215', 'pwd': 'tamer123'},
            {'name': 'Praveen', 'email': 'tamer5@example.com', 'role': 'tamer', 'phone': '9744332216', 'pwd': 'tamer123'},
            {'name': 'Siva', 'email': 'tamer6@example.com', 'role': 'tamer', 'phone': '9744332217', 'pwd': 'tamer123'},
            {'name': 'Surya', 'email': 'tamer7@example.com', 'role': 'tamer', 'phone': '9744332218', 'pwd': 'tamer123'},
            {'name': 'Gopi', 'email': 'tamer8@example.com', 'role': 'tamer', 'phone': '9744332219', 'pwd': 'tamer123'},
            {'name': 'Hari', 'email': 'tamer9@example.com', 'role': 'tamer', 'phone': '9744332220', 'pwd': 'tamer123'},
            {'name': 'Bharath', 'email': 'tamer10@example.com', 'role': 'tamer', 'phone': '9744332221', 'pwd': 'tamer123'},
            {'name': 'Dinesh', 'email': 'dinesh@example.com', 'role': 'public', 'phone': '9544332215', 'pwd': 'user123'},
            {'name': 'Kumar', 'email': 'kumar@example.com', 'role': 'public', 'phone': '9544332216', 'pwd': 'user123'}
        ]
        
        db_users = {}
        for u in users_data:
            user = User.query.filter_by(email=u['email']).first()
            if not user:
                user = User(
                    name=u['name'],
                    email=u['email'],
                    phone=u['phone'],
                    password_hash=hash_password(u['pwd']),
                    role=u['role'],
                    status='active'
                )
                db.session.add(user)
            db_users[u['role']] = db_users.get(u['role'], []) + [user]
            
        db.session.commit()
        print("Users created.")

        owners = db_users.get('owner', [])
        tamers_users = db_users.get('tamer', [])

        # 2. Create Bulls (minimum 15)
        bull_names = ['Karuppan', 'Veeran', 'Komban', 'Marudhan', 'Muni', 'Singam', 'Mayandi', 'Sura', 'Appu', 'Nattamai', 'Ravanan', 'Raatchasan', 'Bhairavan', 'Thimiran', 'Kaalai', 'Sudalai', 'Maduraiyan']
        breeds = ['Kangayam', 'Pulikulam', 'Bargur', 'Umblachery', 'Alambadi']
        colors = ['Black', 'White', 'Brown', 'Grey', 'Spotted', 'Dark Brown', 'Ash']
        villages = ['Alanganallur', 'Palamedu', 'Avaniyapuram', 'Suriyur', 'Siravayal', 'Kandipatti', 'Arapalayam']
        districts = ['Madurai', 'Sivaganga', 'Theni', 'Dindigul', 'Trichy', 'Pudukkottai']
        
        if Bull.query.count() < 15:
            existing_bulls_count = Bull.query.count()
            for i in range(15 - existing_bulls_count):
                owner = random.choice(owners)
                bull = Bull(
                    user_id=owner.id,
                    name=bull_names[i % len(bull_names)],
                    breed=random.choice(breeds),
                    age=random.randint(3, 8),
                    color=random.choice(colors),
                    weight=random.randint(350, 600),
                    height=random.randint(130, 160),
                    history=f'Participated in {random.randint(1, 10)} events, won {random.randint(0, 5)} times.',
                    special_features=random.choice(['Very aggressive, fast runner.', 'Strong horns, unpredictable.', 'Agile and sharp.', 'Heavyweight, hard to grip.']),
                    owner_name=owner.name,
                    owner_aadhaar=f'{random.randint(1000, 9999)}{random.randint(1000, 9999)}{random.randint(1000, 9999)}',
                    owner_phone=owner.phone,
                    owner_email=owner.email,
                    owner_address=f'{random.randint(1, 100)} Main Road, {random.choice(villages)}, {random.choice(districts)}, Tamil Nadu',
                    certificate_status='verified',
                    registration_status='active',
                    payment_status='paid'
                )
                db.session.add(bull)
            db.session.commit()
            print("Bulls created.")
        else:
            print("Bulls already exist.")

        db_bulls = list(Bull.query.all())

        # 3. Create Tamers (minimum 10)
        if Tamer.query.count() < 10:
            existing_tamers = [t.user_id for t in Tamer.query.all()]
            for t_user in tamers_users:
                if t_user.id in existing_tamers:
                    continue
                names = t_user.name.split(' ')
                first_name = names[0]
                last_name = names[1] if len(names) > 1 else ''
                tamer = Tamer(
                    user_id=t_user.id,
                    first_name=first_name,
                    last_name=last_name,
                    email=t_user.email,
                    phone=t_user.phone,
                    age=random.randint(20, 35),
                    gender='Male',
                    height=random.randint(165, 185),
                    weight=random.randint(65, 85),
                    blood_group=random.choice(['O+', 'A+', 'B+', 'AB+', 'O-']),
                    medical_conditions='None',
                    address=f'{random.randint(1, 50)} South Street, {random.choice(villages)}',
                    city=random.choice(districts),
                    state='Tamil Nadu',
                    experience=f'{random.randint(1, 10)} years',
                    specialization=random.choice(['Hump gripping', 'Horn dodging', 'Tail holding', 'Quick evasion']),
                    previous_events=f'{random.choice(villages)} 2023, {random.choice(villages)} 2022',
                    achievements=random.choice(['Best Tamer 2023', 'Runner up 2022', 'Caught 5 bulls in a single event', 'None']),
                    training='Traditional Gurukulam',
                    emergency_name='Local Guardian',
                    emergency_phone=f'98{random.randint(10000000, 99999999)}',
                    emergency_relationship='Relative',
                    certificate_status='valid',
                    registration_status='active',
                    payment_status='paid'
                )
                db.session.add(tamer)
            db.session.commit()
            print("Tamers created.")
        else:
            print("Tamers already exist.")
            
        db_tamers = list(Tamer.query.all())

        # 4. Create Events (minimum 10)
        locations = [
            {'name': 'Alanganallur Jallikattu', 'loc': 'Alanganallur, Madurai', 'dist': 'Madurai'},
            {'name': 'Palamedu Jallikattu', 'loc': 'Palamedu, Madurai', 'dist': 'Madurai'},
            {'name': 'Avaniyapuram Jallikattu', 'loc': 'Avaniyapuram, Madurai', 'dist': 'Madurai'},
            {'name': 'Siravayal Manjuvirattu', 'loc': 'Siravayal, Sivaganga', 'dist': 'Sivaganga'},
            {'name': 'Suriyur Jallikattu', 'loc': 'Suriyur, Trichy', 'dist': 'Trichy'},
            {'name': 'Pallavarayanpatty Jallikattu', 'loc': 'Pallavarayanpatty, Theni', 'dist': 'Theni'},
            {'name': 'Kandipatti Manjuvirattu', 'loc': 'Kandipatti, Sivaganga', 'dist': 'Sivaganga'},
            {'name': 'Arapalayam Jallikattu', 'loc': 'Arapalayam, Madurai', 'dist': 'Madurai'},
            {'name': 'Pudukkottai Vadamadu', 'loc': 'Thirumayam, Pudukkottai', 'dist': 'Pudukkottai'},
            {'name': 'Dindigul Jallikattu', 'loc': 'Natham, Dindigul', 'dist': 'Dindigul'}
        ]
        
        if Event.query.count() < 10:
            existing_events_count = Event.query.count()
            for i in range(10 - existing_events_count):
                loc = locations[i % len(locations)]
                event_date = datetime.utcnow() + timedelta(days=random.randint(10, 90))
                event = Event(
                    name=f"{loc['name']} {event_date.year} (Event {i+1})",
                    type='traditional',
                    date=event_date,
                    time='08:00',
                    start_time='08:00 AM',
                    end_time='04:00 PM',
                    registration_deadline=event_date - timedelta(days=7),
                    location=loc['loc'],
                    district=loc['dist'],
                    state='Tamil Nadu',
                    description=f"Grand traditional Jallikattu event held at {loc['loc']} with thousands of spectators and best bulls from Tamil Nadu.",
                    status='open',
                    max_bulls=random.randint(500, 1000),
                    max_tamers=random.randint(300, 800),
                    entry_fee=random.choice([0, 500, 1000])
                )
                db.session.add(event)
            db.session.commit()
            print("Events created.")
        else:
            print("Events already exist.")
            
        db_events = list(Event.query.all())
            
        # 5. Create Sponsors (minimum 10)
        sponsors_data = [
            {'name': 'Ramraj Cotton', 'amount': 500000, 'designation': 'Title Sponsor', 'desc': 'Traditional Wear Partner.'},
            {'name': 'Aavin Milk', 'amount': 250000, 'designation': 'Co-Sponsor', 'desc': 'Tamil Nadu Co-operative Milk Producers.'},
            {'name': 'Chennai Silks', 'amount': 200000, 'designation': 'Apparel Partner', 'desc': 'Providing traditional dhotis for participants.'},
            {'name': 'TVS Motor Company', 'amount': 300000, 'designation': 'Prize Partner', 'desc': 'Awarding the first prize bikes.'},
            {'name': 'Anandha Bhavan', 'amount': 100000, 'designation': 'Food Partner', 'desc': 'Catering services for officials.'},
            {'name': 'Sri Valli Jewellers', 'amount': 150000, 'designation': 'Gold Partner', 'desc': 'Providing gold coins as prizes.'},
            {'name': 'Sakthi Masala', 'amount': 100000, 'designation': 'Food Partner', 'desc': 'Spice partner for the feast.'},
            {'name': 'Kannan Departmental', 'amount': 75000, 'designation': 'Gift Partner', 'desc': 'Gift hampers for tamers.'},
            {'name': 'Madurai Meenakshi Hospitals', 'amount': 200000, 'designation': 'Medical Partner', 'desc': 'First aid and ambulance services.'},
            {'name': 'Airtel', 'amount': 150000, 'designation': 'Connectivity Partner', 'desc': 'Providing free Wi-Fi zones.'}
        ]
        
        if Sponsor.query.count() < 10:
            existing_sponsors_count = Sponsor.query.count()
            for i in range(10 - existing_sponsors_count):
                s = sponsors_data[i % len(sponsors_data)]
                sponsor = Sponsor(
                    name=s['name'] + f" {i}",
                    amount=s['amount'],
                    designation=s['designation'],
                    description=s['desc']
                )
                db.session.add(sponsor)
            db.session.commit()
            print("Sponsors created.")
        else:
            print("Sponsors already exist.")

        # 6. Create Certificates (minimum 10)
        if Certificate.query.count() < 10:
            for i in range(10):
                target_bull = random.choice(db_bulls)
                target_tamer = random.choice(db_tamers)
                cert_type = random.choice(['veterinary', 'ownership', 'medical'])
                cert = Certificate(
                    bull_id=target_bull.id if cert_type != 'medical' else None,
                    tamer_id=target_tamer.id if cert_type == 'medical' else None,
                    type=cert_type,
                    file_path=f'/uploads/certificates/{cert_type}_{i}.pdf',
                    status='verified',
                    expiry_date=datetime.utcnow() + timedelta(days=365),
                    issued_by='Govt of Tamil Nadu',
                    doctor_name=f'Dr. {random.choice(["Kannan", "Ramesh", "Siva"])}',
                    notes='All health conditions are normal.'
                )
                db.session.add(cert)
            db.session.commit()
            print("Certificates created.")
            
        # 7. Create Payments (minimum 10)
        if Payment.query.count() < 10:
            for i in range(10):
                payment = Payment(
                    type=random.choice(['bull_registration', 'tamer_registration', 'event_booking']),
                    amount=random.choice([500, 1000, 1500]),
                    method=random.choice(['online', 'upi', 'cash']),
                    status='completed',
                    payer_name=f'Payer {i}',
                    payer_phone=f'9876543{i:03d}',
                    transaction_id=f'TXN{random.randint(100000, 999999)}',
                    date=datetime.utcnow() - timedelta(days=random.randint(1, 30))
                )
                db.session.add(payment)
            db.session.commit()
            print("Payments created.")

        # 8. Create Slots and Bookings (ensure minimum 10)
        if EventSlot.query.count() < 10 and len(db_events) > 0:
            print("Creating event slots and bookings...")
            for event in db_events:
                # Create some slots (10 per event)
                for s in range(1, 11):
                    slot = EventSlot(event_id=event.id, slot_number=s, status='available')
                    db.session.add(slot)
            db.session.commit()

            # Assign some bulls and tamers to events
            for event in db_events:
                slots = EventSlot.query.filter_by(event_id=event.id, status='available').all()
                if not slots: continue
                
                # Register a few bulls
                for bull in random.sample(db_bulls, min(3, len(db_bulls))):
                    if not slots: break
                    slot = slots.pop(0)
                    slot.status = 'booked'
                    
                    be = BullEvent.query.filter_by(bull_id=bull.id, event_id=event.id).first()
                    if not be:
                        be = BullEvent(bull_id=bull.id, event_id=event.id, status='registered')
                        db.session.add(be)
                    
                    booking = Booking(
                        event_id=event.id, bull_id=bull.id, slot_id=slot.id,
                        date=event.date, time_slot='Morning', status='confirmed',
                        booked_by=bull.user_id
                    )
                    db.session.add(booking)
                    
                # Register a few tamers
                for tamer in random.sample(db_tamers, min(2, len(db_tamers))):
                    te = TamerEvent.query.filter_by(tamer_id=tamer.id, event_id=event.id).first()
                    if not te:
                        te = TamerEvent(tamer_id=tamer.id, event_id=event.id, status='registered')
                        db.session.add(te)
                    
                    # Assume tamers don't need slots in the same way, or just add a booking
                    booking = Booking(
                        event_id=event.id, tamer_id=tamer.id,
                        date=event.date, time_slot='Morning', status='confirmed',
                        booked_by=tamer.user_id
                    )
                    db.session.add(booking)
                    
            db.session.commit()
            print("Slots and bookings created.")
            
        # 9. Create Sessions (minimum 10)
        if Session.query.count() < 10:
            all_users = User.query.all()
            for i in range(10):
                user = random.choice(all_users)
                sess = Session(
                    user_id=user.id,
                    login_time=datetime.utcnow() - timedelta(hours=random.randint(1, 48)),
                    expires=datetime.utcnow() + timedelta(days=1),
                    ip_address=f'192.168.1.{random.randint(1, 255)}',
                    user_agent='Mozilla/5.0'
                )
                db.session.add(sess)
            db.session.commit()
            print("Sessions created.")
            
        print("Database seeded successfully!")

if __name__ == '__main__':
    seed_database()
