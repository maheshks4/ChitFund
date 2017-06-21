using ServiceStack.DataAnnotations;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ChitFund.Model
{
    [Alias("Users")]
    public class Contact
    {
        [Key]
        [Alias("Id")]
        [AutoIncrement]
        public int ContactID { get; set; }
    
        public string Name { get; set; }
        [Alias("PhoneNo")]
        public string Phone { get; set; }
        [Alias("EmailId")]
        public string Email { get; set; }   
        public string Address { get; set; }
        [Ignore]
        public int PrimaryType { get; set; } // 1: Phone; 2: Email.
        [Ignore]
        public DateTime? AuditTime { get; set; }
    }

    public class ContactListResponse
    {
        public Contacts Contacts { get; set; }
    }

    public class Contacts : List<Contact> { }

    public class AddContactResponse
    {
        public int ContactID { get; set; }
    }

    public class AddContactsResponse
    {
        public List<int> ContactIdList { get; set; }
    }
}